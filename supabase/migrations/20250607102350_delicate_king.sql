/*
  # Add Groups Table and Schema Updates

  1. New Tables
    - groups: For managing hotel owner groups
      - id (uuid, primary key)
      - name (text)
      - description (text)
      - user_ids (uuid array)
      - logo_url (text)
      - contact_info (jsonb)
      - metadata (jsonb)
      - created_at (timestamptz)
      - updated_at (timestamptz)
      - created_by (uuid)
      - updated_by (uuid)
      
  2. Changes to Existing Tables
    - ALTER TABLE hotels
      - Add group_id (uuid)
      
    - ALTER TABLE users
      - Add group_ids (uuid array)
      - Add 'group_admin' role option
      
    - Add group_id to incidents, maintenance_requests, quality_visits, lost_items
    - Add group_ids to procedures, suppliers
      
  3. Security
    - Enable RLS on groups table
    - Add policies for authenticated users
    - Update RLS policies on existing tables to account for groups
      
  4. Changes
    - Create groups table for hotel owner groups
    - Modify existing tables to support group-based organization
    - Update authorization model to filter based on groups
*/

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  user_ids uuid[] NOT NULL DEFAULT '{}',
  logo_url text,
  contact_info jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Add group_id to hotels
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id);
CREATE INDEX IF NOT EXISTS idx_hotels_group_id ON hotels(group_id);

-- Add group_ids to users and update role type
ALTER TABLE users ADD COLUMN IF NOT EXISTS group_ids uuid[] NOT NULL DEFAULT '{}';
-- Can't directly modify enum in a migration, so we'll add a custom check constraint instead
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_role;
ALTER TABLE users ADD CONSTRAINT check_role CHECK (role IN ('admin', 'group_admin', 'hotel_admin', 'standard'));

-- Add group_id to relevant tables
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id);
CREATE INDEX IF NOT EXISTS idx_incidents_group_id ON incidents(group_id);

ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_group_id ON maintenance_requests(group_id);

ALTER TABLE quality_visits ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id);
CREATE INDEX IF NOT EXISTS idx_quality_visits_group_id ON quality_visits(group_id);

ALTER TABLE lost_items ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id);
CREATE INDEX IF NOT EXISTS idx_lost_items_group_id ON lost_items(group_id);

-- Add group_ids to multi-group tables
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS group_ids uuid[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_procedures_group_ids ON procedures USING GIN(group_ids);

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS group_ids uuid[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_suppliers_group_ids ON suppliers USING GIN(group_ids);

-- Enable RLS on groups table
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for groups
CREATE POLICY "Admins can manage groups" ON groups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Everyone can read groups they have access to
CREATE POLICY "Users can read their own groups" ON groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        u.id = ANY(user_ids) OR 
        u.group_ids && ARRAY[id]
      )
    )
  );

-- Update RLS policies for other tables to consider group access

-- Update hotels policy
CREATE POLICY "Users can access hotels through groups" ON hotels
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        hotels.id = ANY(u.hotels) OR
        (hotels.group_id IS NOT NULL AND hotels.group_id = ANY(u.group_ids))
      )
    )
  );

-- Update incidents policy
CREATE POLICY "Users can access incidents through groups" ON incidents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        incidents.hotel_id = ANY(u.hotels) OR
        (incidents.group_id IS NOT NULL AND incidents.group_id = ANY(u.group_ids))
      )
    )
  );

-- Update maintenance_requests policy
CREATE POLICY "Users can access maintenance through groups" ON maintenance_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        maintenance_requests.hotel_id = ANY(u.hotels) OR
        (maintenance_requests.group_id IS NOT NULL AND maintenance_requests.group_id = ANY(u.group_ids))
      )
    )
  );

-- Update quality_visits policy
CREATE POLICY "Users can access quality visits through groups" ON quality_visits
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        quality_visits.hotel_id = ANY(u.hotels) OR
        (quality_visits.group_id IS NOT NULL AND quality_visits.group_id = ANY(u.group_ids))
      )
    )
  );

-- Update lost_items policy
CREATE POLICY "Users can access lost items through groups" ON lost_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        lost_items.hotel_id = ANY(u.hotels) OR
        (lost_items.group_id IS NOT NULL AND lost_items.group_id = ANY(u.group_ids))
      )
    )
  );

-- Update procedures policy
CREATE POLICY "Users can access procedures through groups" ON procedures
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        (procedures.hotel_ids && u.hotels) OR
        (procedures.group_ids && u.group_ids)
      )
    )
  );

-- Update suppliers policy
CREATE POLICY "Users can access suppliers through groups" ON suppliers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'admin' OR 
        (suppliers.hotel_ids && u.hotels) OR
        (suppliers.group_ids && u.group_ids)
      )
    )
  );

-- Create automatic group_id population function
CREATE OR REPLACE FUNCTION set_group_id_from_hotel()
RETURNS TRIGGER AS $$
BEGIN
  -- Fetch the group_id from the hotel
  SELECT group_id INTO NEW.group_id
  FROM hotels
  WHERE id = NEW.hotel_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically set group_id based on hotel_id
CREATE TRIGGER set_incident_group_id
BEFORE INSERT ON incidents
FOR EACH ROW
EXECUTE FUNCTION set_group_id_from_hotel();

CREATE TRIGGER set_maintenance_group_id
BEFORE INSERT ON maintenance_requests
FOR EACH ROW
EXECUTE FUNCTION set_group_id_from_hotel();

CREATE TRIGGER set_quality_visit_group_id
BEFORE INSERT ON quality_visits
FOR EACH ROW
EXECUTE FUNCTION set_group_id_from_hotel();

CREATE TRIGGER set_lost_item_group_id
BEFORE INSERT ON lost_items
FOR EACH ROW
EXECUTE FUNCTION set_group_id_from_hotel();