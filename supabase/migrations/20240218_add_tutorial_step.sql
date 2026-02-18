-- Add tutorial_step to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tutorial_step INTEGER DEFAULT 0;

-- Comment on column
COMMENT ON COLUMN profiles.tutorial_step IS 'Current step in the onboarding tutorial (0=Not started)';
