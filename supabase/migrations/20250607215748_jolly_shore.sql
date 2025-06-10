/*
  # Fix Gamification RLS Policies

  1. Changes
    - Drop existing restrictive RLS policies on user_gamification_stats
    - Add policy allowing authenticated users to read gamification stats (needed for leaderboards)
    - Add policy allowing authenticated users to insert their own stats
    - Re-add update policy for users' own stats
    - Re-add service role policy for all operations

  2. Security
    - Maintain data security while allowing necessary gamification operations
    - Users can only insert/update their own records
    - Service role maintains full access for system operations
*/

-- Drop existing policies on user_gamification_stats
DROP POLICY IF EXISTS "Users can read their own gamification stats" ON user_gamification_stats;
DROP POLICY IF EXISTS "Users can update their own gamification stats" ON user_gamification_stats;
DROP POLICY IF EXISTS "Service can insert/update gamification stats" ON user_gamification_stats;

-- Create new RLS policies for user_gamification_stats

-- Allow authenticated users to read all gamification stats (needed for leaderboards and stats comparison)
CREATE POLICY "Authenticated users can read gamification stats" ON user_gamification_stats
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert their own gamification stats
CREATE POLICY "Users can insert their own gamification stats" ON user_gamification_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own gamification stats
CREATE POLICY "Users can update their own gamification stats" ON user_gamification_stats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow service role full access for system operations
CREATE POLICY "Service can manage all gamification stats" ON user_gamification_stats
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);