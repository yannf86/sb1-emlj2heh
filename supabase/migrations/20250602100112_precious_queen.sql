/*
  # Fix Users Table RLS Permissions

  1. Security Changes
    - Update RLS policy for users table to allow querying by email
    - Enable authenticated users to read user records where email matches their auth.email()
    - This fixes the "Missing or insufficient permissions" error during login

  2. Changes
    - Drop existing restrictive policy
    - Create new policy with expanded permissions
*/

-- Drop the existing policy that's too restrictive
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Create new policy with expanded permissions
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    auth.email() = email OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );