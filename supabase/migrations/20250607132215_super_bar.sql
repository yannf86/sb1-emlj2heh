/*
  # Add Logbook Module Schema

  1. New Tables
    - logbook_entries: Main journal entries
    - logbook_comments: Comments on entries  
    - logbook_reminders: Reminders attached to entries
    - logbook_read_status: Track read status by user
    - logbook_tags: Tags/categories for entries
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Changes
    - Create complete schema for logbook functionality
    - Add appropriate indexes and constraints
    - Enable row-level security with proper access controls
*/

-- Create logbook_services table (for different departments)
CREATE TABLE IF NOT EXISTS logbook_services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text NOT NULL,
  icon text,
  color text,
  hotel_id uuid REFERENCES hotels(id),
  group_id uuid REFERENCES groups(id),
  active boolean NOT NULL DEFAULT true,
  "order" integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  UNIQUE (code, hotel_id)
);

-- Create logbook_tags table
CREATE TABLE IF NOT EXISTS logbook_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text NOT NULL,
  color text,
  hotel_id uuid REFERENCES hotels(id),
  group_id uuid REFERENCES groups(id),
  active boolean NOT NULL DEFAULT true,
  "order" integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  UNIQUE (code, hotel_id)
);

-- Create logbook_entries table
CREATE TABLE IF NOT EXISTS logbook_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  time time NOT NULL,
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  group_id uuid REFERENCES groups(id),
  service_id uuid NOT NULL REFERENCES logbook_services(id),
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES users(id),
  importance integer NOT NULL DEFAULT 1, -- 1: normal, 2: important, 3: critical
  status text NOT NULL DEFAULT 'active', -- active, completed, archived
  assigned_to uuid[] DEFAULT '{}',
  room_number text,
  tag_ids uuid[] DEFAULT '{}',
  attachments jsonb DEFAULT '[]',
  metadata jsonb,
  history jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Create logbook_comments table
CREATE TABLE IF NOT EXISTS logbook_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id uuid NOT NULL REFERENCES logbook_entries(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Create logbook_reminders table
CREATE TABLE IF NOT EXISTS logbook_reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id uuid NOT NULL REFERENCES logbook_entries(id) ON DELETE CASCADE,
  remind_at timestamptz NOT NULL,
  title text NOT NULL,
  description text,
  user_ids uuid[] NOT NULL DEFAULT '{}',
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  completed_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Create logbook_read_status table
CREATE TABLE IF NOT EXISTS logbook_read_status (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id uuid NOT NULL REFERENCES logbook_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entry_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_logbook_entries_hotel_id ON logbook_entries(hotel_id);
CREATE INDEX idx_logbook_entries_group_id ON logbook_entries(group_id);
CREATE INDEX idx_logbook_entries_service_id ON logbook_entries(service_id);
CREATE INDEX idx_logbook_entries_date ON logbook_entries(date);
CREATE INDEX idx_logbook_entries_author_id ON logbook_entries(author_id);
CREATE INDEX idx_logbook_entries_status ON logbook_entries(status);
CREATE INDEX idx_logbook_entries_tag_ids ON logbook_entries USING GIN(tag_ids);
CREATE INDEX idx_logbook_entries_assigned_to ON logbook_entries USING GIN(assigned_to);
CREATE INDEX idx_logbook_comments_entry_id ON logbook_comments(entry_id);
CREATE INDEX idx_logbook_reminders_entry_id ON logbook_reminders(entry_id);
CREATE INDEX idx_logbook_reminders_remind_at ON logbook_reminders(remind_at);
CREATE INDEX idx_logbook_read_status_entry_id ON logbook_read_status(entry_id);
CREATE INDEX idx_logbook_read_status_user_id ON logbook_read_status(user_id);

-- Enable row level security
ALTER TABLE logbook_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook_read_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for logbook_services
CREATE POLICY "Users can read logbook_services" ON logbook_services
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        hotel_id = ANY(u.hotels) OR
        (group_id IS NOT NULL AND group_id = ANY(u.group_ids))
      )
    )
  );

CREATE POLICY "Admins can modify logbook_services" ON logbook_services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR
        u.role = 'hotel_admin' AND hotel_id = ANY(u.hotels) OR
        u.role = 'group_admin' AND group_id = ANY(u.group_ids)
      )
    )
  );

-- Create RLS policies for logbook_tags
CREATE POLICY "Users can read logbook_tags" ON logbook_tags
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        hotel_id = ANY(u.hotels) OR
        (group_id IS NOT NULL AND group_id = ANY(u.group_ids))
      )
    )
  );

CREATE POLICY "Admins can modify logbook_tags" ON logbook_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR
        u.role = 'hotel_admin' AND hotel_id = ANY(u.hotels) OR
        u.role = 'group_admin' AND group_id = ANY(u.group_ids)
      )
    )
  );

-- Create RLS policies for logbook_entries
CREATE POLICY "Users can read logbook entries for their hotels" ON logbook_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        hotel_id = ANY(u.hotels) OR
        (group_id IS NOT NULL AND group_id = ANY(u.group_ids))
      )
    )
  );

CREATE POLICY "Users can create logbook entries for their hotels" ON logbook_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        hotel_id = ANY(u.hotels) OR
        (group_id IS NOT NULL AND group_id = ANY(u.group_ids))
      )
    )
  );

CREATE POLICY "Users can update logbook entries they created" ON logbook_entries
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR
        u.role = 'hotel_admin' AND hotel_id = ANY(u.hotels) OR
        u.role = 'group_admin' AND group_id = ANY(u.group_ids)
      )
    )
  );

-- Create RLS policies for logbook_comments
CREATE POLICY "Users can read logbook comments" ON logbook_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM logbook_entries e 
      WHERE e.id = entry_id 
      AND (
        EXISTS (
          SELECT 1 FROM users u 
          WHERE u.id = auth.uid() 
          AND (
            u.role = 'admin' OR 
            e.hotel_id = ANY(u.hotels) OR
            (e.group_id IS NOT NULL AND e.group_id = ANY(u.group_ids))
          )
        )
      )
    )
  );

CREATE POLICY "Users can create logbook comments" ON logbook_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM logbook_entries e 
      WHERE e.id = entry_id 
      AND (
        EXISTS (
          SELECT 1 FROM users u 
          WHERE u.id = auth.uid() 
          AND (
            u.role = 'admin' OR 
            e.hotel_id = ANY(u.hotels) OR
            (e.group_id IS NOT NULL AND e.group_id = ANY(u.group_ids))
          )
        )
      )
    )
  );

-- Create RLS policies for logbook_reminders
CREATE POLICY "Users can read logbook reminders" ON logbook_reminders
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = ANY(user_ids) OR
    EXISTS (
      SELECT 1 FROM logbook_entries e 
      WHERE e.id = entry_id 
      AND (
        EXISTS (
          SELECT 1 FROM users u 
          WHERE u.id = auth.uid() 
          AND (
            u.role = 'admin' OR 
            e.hotel_id = ANY(u.hotels) OR
            (e.group_id IS NOT NULL AND e.group_id = ANY(u.group_ids))
          )
        )
      )
    )
  );

CREATE POLICY "Users can create logbook reminders" ON logbook_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM logbook_entries e 
      WHERE e.id = entry_id 
      AND (
        EXISTS (
          SELECT 1 FROM users u 
          WHERE u.id = auth.uid() 
          AND (
            u.role = 'admin' OR 
            e.hotel_id = ANY(u.hotels) OR
            (e.group_id IS NOT NULL AND e.group_id = ANY(u.group_ids))
          )
        )
      )
    )
  );

-- Create RLS policies for logbook_read_status
CREATE POLICY "Users can track their own read status" ON logbook_read_status
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Set up automatic group_id population from hotel_id
CREATE OR REPLACE FUNCTION set_logbook_entry_group_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Fetch the group_id from the hotel
  SELECT group_id INTO NEW.group_id
  FROM hotels
  WHERE id = NEW.hotel_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set group_id based on hotel_id
CREATE TRIGGER set_logbook_entry_group_id
BEFORE INSERT ON logbook_entries
FOR EACH ROW
EXECUTE FUNCTION set_logbook_entry_group_id();