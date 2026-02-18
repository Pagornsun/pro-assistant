-- Create User Role Enum
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user';

-- Create Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );

-- Create Policy: Admins can update all profiles (optional, for banning)
-- CREATE POLICY "Admins can update all profiles" ... 
