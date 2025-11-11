-- Add is_active column to categories and difficulties tables
-- This allows soft-delete functionality and control over active metadata

-- Add is_active to categories
ALTER TABLE IF EXISTS categories
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add index for is_active on categories
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Add is_active to difficulties
ALTER TABLE IF EXISTS difficulties
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add index for is_active on difficulties
CREATE INDEX IF NOT EXISTS idx_difficulties_is_active ON difficulties(is_active);

-- Add updated_at column to categories
ALTER TABLE IF EXISTS categories
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at column to difficulties
ALTER TABLE IF EXISTS difficulties
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create or replace trigger for categories (PostgreSQL doesn't support IF NOT EXISTS for triggers)
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create or replace trigger for difficulties
DROP TRIGGER IF EXISTS update_difficulties_updated_at ON difficulties;
CREATE TRIGGER update_difficulties_updated_at BEFORE UPDATE ON difficulties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at column for existing rows
UPDATE categories SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE difficulties SET updated_at = NOW() WHERE updated_at IS NULL;
