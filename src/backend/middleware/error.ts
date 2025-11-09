import { createMiddleware } from 'hono/factory';
import { match, P } from 'ts-pattern';
import {
  contextKeys,
  type AppEnv,
  type AppLogger,
} from '@/backend/hono/context';

export const errorBoundary = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    try {
      await next();
    } catch (error) {
      const logger = c.get(contextKeys.logger) as AppLogger | undefined;
      const message = match(error)
        .with(P.instanceOf(Error), (err) => err.message)
        .otherwise(() => 'Unexpected error');

      logger?.error?.(error);

      return c.json(
        {
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message,
          },
        },
        500,
      );
    }
  });

export const ERROR_CODES = {
  DATABASE_ERROR: 'DATABASE_ERROR',
  ASSIGNMENT_WEIGHT_EXCEEDED: 'ASSIGNMENT_WEIGHT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  ENROLLMENT_LIMIT_EXCEEDED: 'ENROLLMENT_LIMIT_EXCEEDED',
  SUBMISSION_DEADLINE_PASSED: 'SUBMISSION_DEADLINE_PASSED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;
