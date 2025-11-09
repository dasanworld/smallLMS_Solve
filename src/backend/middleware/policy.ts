import { createMiddleware } from 'hono/factory';
import type { Context, Env } from 'hono';
import { ERROR_CODES } from './error';

// Define AppEnv type for middleware
export type AppEnv = Env & {
  Variables: {
    // Define any variables that will be set by this middleware
  };
};

/**
 * Rate limiting middleware
 * Implements a simple in-memory rate limiter based on IP address
 */
export const rateLimit = (maxRequests: number, windowMs: number) => {
  // In-memory store for rate limiting (use Redis in production)
  const store = new Map<string, { count: number; resetTime: number }>();

  return createMiddleware<AppEnv>(async (c, next) => {
    // Get client IP (consider using a more robust method in production)
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 
               c.req.header('x-real-ip') || 
               c.req.raw.headers.get('cf-connecting-ip') || // Cloudflare
               c.req.raw.headers.get('x-real-ip') || 
               "0.0.0.0";

    const clientId = ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!store.has(clientId)) {
      store.set(clientId, { count: 1, resetTime: now + windowMs });
    } else {
      const record = store.get(clientId)!;
      if (record.resetTime < now) {
        // Reset the counter if the window has passed
        record.count = 1;
        record.resetTime = now + windowMs;
      } else {
        record.count++;
      }

      if (record.count > maxRequests) {
        // Rate limit exceeded
        return c.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
              message: `Rate limit exceeded. Please try again later.`,
              details: {
                retryAfter: Math.floor((record.resetTime - now) / 1000) // seconds
              }
            }
          },
          429
        );
      }
    }

    // Continue to the next middleware/route
    await next();
  });
};

/**
 * Request size limit middleware
 * Limits the size of incoming requests
 */
export const requestSizeLimit = (maxSize: number) => {
  return createMiddleware<AppEnv>(async (c, next) => {
    // Check Content-Length header if available
    const contentLength = c.req.header('Content-Length');
    
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > maxSize) {
        return c.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: `Request size too large. Maximum allowed: ${maxSize} bytes.`,
              details: {
                maxSize,
                actualSize: size
              }
            }
          },
          413 // Payload Too Large
        );
      }
    }

    await next();
  });
};

/**
 * HTTP method restriction middleware
 * Restricts which HTTP methods are allowed
 */
export const allowedMethods = (methods: string[]) => {
  return createMiddleware<AppEnv>(async (c, next) => {
    const method = c.req.method.toUpperCase();
    
    if (!methods.includes(method)) {
      return c.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: `Method ${method} not allowed. Allowed methods: ${methods.join(', ')}.`
          }
        },
        405 // Method Not Allowed
      );
    }

    await next();
  });
};

/**
 * CORS policy middleware
 * Sets appropriate CORS headers
 */
export const corsPolicy = (allowedOrigins: string[] = ['*']) => {
  return createMiddleware<AppEnv>(async (c, next) => {
    const origin = c.req.header('Origin');
    
    // Set CORS headers
    c.header('Access-Control-Allow-Origin', 
      allowedOrigins.includes('*') || !origin ? allowedOrigins[0] : 
      allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
    
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    c.header('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight requests
    if (c.req.method === 'OPTIONS') {
      return c.body(null, 204);
    }

    await next();
  });
};

/**
 * Security headers middleware
 * Adds common security headers to responses
 */
export const securityHeaders = () => {
  return createMiddleware<AppEnv>(async (c, next) => {
    await next();
    
    // Set security headers
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  });
};

/**
 * Request validation middleware
 * Validates common request parameters and headers
 */
export const validateRequest = () => {
  return createMiddleware<AppEnv>(async (c, next) => {
    // Check for common security issues
    const userAgent = c.req.header('User-Agent');
    if (userAgent && isSuspiciousUserAgent(userAgent)) {
      return c.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Suspicious request blocked.'
          }
        },
        400
      );
    }

    // Check for potential SQL injection patterns in query parameters
    const queryParams = c.req.queries();
    for (const [key, values] of Object.entries(queryParams)) {
      for (const value of values || []) {
        if (isSuspiciousInput(value)) {
          return c.json(
            {
              success: false,
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Invalid request parameters.'
              }
            },
            400
          );
        }
      }
    }

    await next();
  });
};

// Helper functions
const isSuspiciousUserAgent = (userAgent: string): boolean => {
  // List of known suspicious user agents
  const suspiciousPatterns = [
    /sqlmap/i,
    /nmap/i,
    /nikto/i,
    /nessus/i,
    /acunetix/i,
    /dirbuster/i,
    /w3af/i,
    /netsparker/i,
    /burp/i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
};

const isSuspiciousInput = (input: string): boolean => {
  // Check for common SQL injection patterns
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|WAITFOR|SLEEP)\b)/i,
    /('|--|\/\*|\*\/|;)/,
    /(xp_|sp_|fn_|sysobjects|syscolumns)/i,
  ];

  return sqlInjectionPatterns.some(pattern => pattern.test(input));
};

/**
 * Combined API policy middleware
 * Applies multiple security policies at once
 */
export const apiPolicy = (
  rateLimitConfig?: { maxRequests: number; windowMs: number },
  sizeLimit?: number,
  allowedMethodsList?: string[],
  corsOrigins?: string[]
) => {
  return createMiddleware<AppEnv>(async (c, next) => {
    // Apply security headers
    await securityHeaders()(c, async () => {
      // Apply CORS policy if configured
      if (corsOrigins) {
        await corsPolicy(corsOrigins)(c, async () => {
          // Apply rate limiting if configured
          if (rateLimitConfig) {
            await rateLimit(rateLimitConfig.maxRequests, rateLimitConfig.windowMs)(c, async () => {
              // Apply request size limit if configured
              if (sizeLimit) {
                await requestSizeLimit(sizeLimit)(c, async () => {
                  // Apply method restriction if configured
                  if (allowedMethodsList) {
                    await allowedMethods(allowedMethodsList)(c, async () => {
                      // Apply request validation
                      await validateRequest()(c, next);
                    });
                  } else {
                    // Apply request validation
                    await validateRequest()(c, next);
                  }
                });
              } else {
                // Apply method restriction if configured
                if (allowedMethodsList) {
                  await allowedMethods(allowedMethodsList)(c, async () => {
                    // Apply request validation
                    await validateRequest()(c, next);
                  });
                } else {
                  // Apply request validation
                  await validateRequest()(c, next);
                }
              }
            });
          } else {
            // Apply request size limit if configured
            if (sizeLimit) {
              await requestSizeLimit(sizeLimit)(c, async () => {
                // Apply method restriction if configured
                if (allowedMethodsList) {
                  await allowedMethods(allowedMethodsList)(c, async () => {
                    // Apply request validation
                    await validateRequest()(c, next);
                  });
                } else {
                  // Apply request validation
                  await validateRequest()(c, next);
                }
              });
            } else {
              // Apply method restriction if configured
              if (allowedMethodsList) {
                await allowedMethods(allowedMethodsList)(c, async () => {
                  // Apply request validation
                  await validateRequest()(c, next);
                });
              } else {
                // Apply request validation
                await validateRequest()(c, next);
              }
            }
          }
        });
      } else {
        // Apply rate limiting if configured
        if (rateLimitConfig) {
          await rateLimit(rateLimitConfig.maxRequests, rateLimitConfig.windowMs)(c, async () => {
            // Apply request size limit if configured
            if (sizeLimit) {
              await requestSizeLimit(sizeLimit)(c, async () => {
                // Apply method restriction if configured
                if (allowedMethodsList) {
                  await allowedMethods(allowedMethodsList)(c, async () => {
                    // Apply request validation
                    await validateRequest()(c, next);
                  });
                } else {
                  // Apply request validation
                  await validateRequest()(c, next);
                }
              });
            } else {
              // Apply method restriction if configured
              if (allowedMethodsList) {
                await allowedMethods(allowedMethodsList)(c, async () => {
                  // Apply request validation
                  await validateRequest()(c, next);
                });
              } else {
                // Apply request validation
                await validateRequest()(c, next);
              }
            }
          });
        } else {
          // Apply request size limit if configured
          if (sizeLimit) {
            await requestSizeLimit(sizeLimit)(c, async () => {
              // Apply method restriction if configured
              if (allowedMethodsList) {
                await allowedMethods(allowedMethodsList)(c, async () => {
                  // Apply request validation
                  await validateRequest()(c, next);
                });
              } else {
                // Apply request validation
                await validateRequest()(c, next);
              }
            });
          } else {
            // Apply method restriction if configured
            if (allowedMethodsList) {
              await allowedMethods(allowedMethodsList)(c, async () => {
                // Apply request validation
                await validateRequest()(c, next);
              });
            } else {
              // Apply request validation
              await validateRequest()(c, next);
            }
          }
        }
      }
    });
  });
};