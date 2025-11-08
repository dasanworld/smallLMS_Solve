import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import { z } from 'zod';

// Define the user profile response schema
export const UserProfileResponseSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  role: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;

// Error codes for user profile service
const userProfileErrorCodes = {
  USER_PROFILE_FETCH_ERROR: 'USER_PROFILE_FETCH_ERROR',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_PROFILE_VALIDATION_ERROR: 'USER_PROFILE_VALIDATION_ERROR',
} as const;

type UserProfileErrorCode = typeof userProfileErrorCodes[keyof typeof userProfileErrorCodes];

/**
 * Gets the user profile by user ID
 * @param client Supabase client
 * @param userId ID of the user
 * @returns User profile information
 */
export const getUserProfileService = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<UserProfileResponse, UserProfileErrorCode, unknown>> => {
  const { data, error } = await client
    .from('users')
    .select('id, email, role, name, phone, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) {
    return failure(500, userProfileErrorCodes.USER_PROFILE_FETCH_ERROR, 'Failed to fetch user profile', error.message);
  }

  if (!data) {
    return failure(404, userProfileErrorCodes.USER_NOT_FOUND, 'User profile not found');
  }

  // Map the response to match our expected structure
  const profile = {
    id: data.id,
    email: data.email,
    role: data.role,
    name: data.name,
    phone: data.phone,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  // Validate the response
  const parsed = UserProfileResponseSchema.safeParse(profile);
  if (!parsed.success) {
    return failure(
      500,
      'USER_PROFILE_VALIDATION_ERROR',
      'User profile response failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};