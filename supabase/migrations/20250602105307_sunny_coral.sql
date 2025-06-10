/*
  # Fix Users Table RLS Permissions

  1. Security Changes
    - Update RLS policy for users table to allow all authenticated users to read all user records
    - This fixes the "Missing or insufficient permissions" error when retrieving user names for display
    - Essential for displaying names in maintenance lists, incident forms, etc.

  2. Changes
    - Drop existing restrictive policy
    - Create new policy with full read permissions for authenticated users
*/

-- Drop the existing policy that's too restrictive
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create new policy with expanded permissions - allow all authenticated users to read all user records
CREATE POLICY "Users can read all user data" ON users
  FOR SELECT
  TO authenticated
  USING (true);