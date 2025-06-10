/*
  # Fix Users Table RLS Permissions for Display Names

  1. Security Changes
    - Ensure RLS is enabled on users table
    - Drop any existing restrictive policies
    - Create policy allowing all authenticated users to read user records
    - This is essential for displaying user names in maintenance lists, incident forms, etc.

  2. Changes
    - Enable RLS on users table
    - Drop existing policies that may be too restrictive
    - Create new policy with full read permissions for authenticated users
    - This allows the maintenance list and other components to display user names properly
*/

-- Ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can read all user data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;

-- Create new policy allowing all authenticated users to read all user records
-- This is necessary for displaying user names in lists and forms
CREATE POLICY "Authenticated users can read all user data" ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure users can still update their own profile data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to insert their own profile (for registration)
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);