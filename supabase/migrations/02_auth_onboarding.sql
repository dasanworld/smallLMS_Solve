-- Migration: Add indexes for users and user_terms_agreement tables for onboarding flow

-- Indexes for users table (already exist based on schema, but explicitly defined for clarity)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Indexes for user_terms_agreement table
CREATE INDEX IF NOT EXISTS idx_user_terms_agreement_user_id ON user_terms_agreement(user_id);
CREATE INDEX IF NOT EXISTS idx_user_terms_agreement_agreed_at ON user_terms_agreement(agreed_at);

-- Ensure RLS is disabled for users table (as per AGENT.md guidelines)
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- Ensure RLS is disabled for user_terms_agreement table (as per AGENT.md guidelines)
ALTER TABLE IF EXISTS public.user_terms_agreement DISABLE ROW LEVEL SECURITY;