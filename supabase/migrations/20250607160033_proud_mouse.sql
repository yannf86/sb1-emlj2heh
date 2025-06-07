/*
  # Add Gamification Tables

  1. New Tables
    - user_gamification_stats: User's gamification stats and progression
    - gamification_action_history: History of user gamification actions 
    - gamification_rate_limits: Rate limiting for gamification actions
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Changes
    - Create complete schema for gamification persistence
    - Add appropriate indexes and constraints
    - Enable row-level security with proper access controls
*/

-- Create user_gamification_stats table
CREATE TABLE IF NOT EXISTS user_gamification_stats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  badges text[] NOT NULL DEFAULT '{}',
  
  -- Incident stats
  incidents_created integer NOT NULL DEFAULT 0,
  incidents_resolved integer NOT NULL DEFAULT 0,
  critical_incidents_resolved integer NOT NULL DEFAULT 0,
  avg_resolution_time float NOT NULL DEFAULT 0,
  
  -- Maintenance stats
  maintenance_created integer NOT NULL DEFAULT 0,
  maintenance_completed integer NOT NULL DEFAULT 0,
  quick_maintenance_completed integer NOT NULL DEFAULT 0,
  
  -- Quality stats
  quality_checks_completed integer NOT NULL DEFAULT 0,
  avg_quality_score float NOT NULL DEFAULT 0,
  high_quality_checks integer NOT NULL DEFAULT 0,
  
  -- Lost items stats
  lost_items_registered integer NOT NULL DEFAULT 0,
  lost_items_returned integer NOT NULL DEFAULT 0,
  
  -- Procedures stats
  procedures_created integer NOT NULL DEFAULT 0,
  procedures_read integer NOT NULL DEFAULT 0,
  procedures_validated integer NOT NULL DEFAULT 0,
  
  -- General stats
  consecutive_logins integer NOT NULL DEFAULT 0,
  total_logins integer NOT NULL DEFAULT 0,
  last_login_date timestamptz,
  weekly_goals_completed integer NOT NULL DEFAULT 0,
  thanks_received integer NOT NULL DEFAULT 0,
  help_provided integer NOT NULL DEFAULT 0,
  
  -- Module contributions
  contributions_per_module jsonb NOT NULL DEFAULT '{}',
  
  -- Streak stats
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Create gamification_action_history table
CREATE TABLE IF NOT EXISTS gamification_action_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  action_details jsonb,
  xp_gained integer NOT NULL DEFAULT 0,
  details jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Create gamification_rate_limits table
CREATE TABLE IF NOT EXISTS gamification_rate_limits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  limit_type text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, action, limit_type)
);

-- Enable row level security
ALTER TABLE user_gamification_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_action_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_gamification_stats
CREATE POLICY "Users can read their own gamification stats" ON user_gamification_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification stats" ON user_gamification_stats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert/update gamification stats" ON user_gamification_stats
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create RLS policies for gamification_action_history
CREATE POLICY "Users can read their own action history" ON gamification_action_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert action history" ON gamification_action_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create RLS policies for gamification_rate_limits
CREATE POLICY "Users can read their own rate limits" ON gamification_rate_limits
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage rate limits" ON gamification_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_user_gamification_stats_user_id ON user_gamification_stats(user_id);
CREATE INDEX idx_gamification_action_history_user_id ON gamification_action_history(user_id);
CREATE INDEX idx_gamification_action_history_action ON gamification_action_history(action);
CREATE INDEX idx_gamification_action_history_timestamp ON gamification_action_history(timestamp);
CREATE INDEX idx_gamification_rate_limits_user_id_action ON gamification_rate_limits(user_id, action);
CREATE INDEX idx_gamification_rate_limits_reset_at ON gamification_rate_limits(reset_at);

-- Function to auto-increment user XP
CREATE OR REPLACE FUNCTION increment_user_xp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_gamification_stats
  SET xp = xp + NEW.xp_gained,
      updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update XP when a new action is recorded
CREATE TRIGGER update_user_xp_on_action
AFTER INSERT ON gamification_action_history
FOR EACH ROW
EXECUTE FUNCTION increment_user_xp();