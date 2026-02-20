-- Add display_name and picture_url to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS picture_url TEXT;

-- Update RLS policies if needed (users can update these)
-- (Existing policy "Users can update own profile" should cover it if it allows ALL columns)
