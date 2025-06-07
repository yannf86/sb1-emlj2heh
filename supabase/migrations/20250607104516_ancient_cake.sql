/*
  # Fix Groups Table Permissions

  1. Changes
    - Drop the restrictive "Users can read their own groups" policy
    - Create a new policy allowing all authenticated users to read groups
    - This is appropriate for groups as they are typically lookup data

  2. Security
    - Maintains RLS on groups table
    - Allows authenticated users to read all groups
    - Admin-only access for write operations remains unchanged
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can read their own groups" ON groups;

-- Create a new policy allowing all authenticated users to read groups
CREATE POLICY "Authenticated users can read all groups" ON groups
  FOR SELECT
  TO authenticated
  USING (true);