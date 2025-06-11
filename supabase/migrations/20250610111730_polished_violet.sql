/*
  # Add Separate Checklist Collection for Logbook

  1. New Tables
    - logbook_checklist_items: Separate collection for checklist tasks
      - id (uuid, primary key)
      - title (text) - Title of the checklist item
      - description (text) - Optional description
      - serviceId (uuid) - Service associated with the task
      - dueDate (date) - Due date for the task
      - endDate (date) - End date for recurring or range tasks
      - isPermanent (boolean) - Whether this is a permanent/recurring checklist item
      - hotelId (uuid) - Associated hotel
      - group_id (uuid) - Group associated with the hotel
      - completed (boolean) - Whether the task is completed
      - completedById (uuid) - User who completed the task
      - completedAt (timestamptz) - When the task was completed
      - history (jsonb) - History of changes

  2. Security
    - Enable RLS on the new table
    - Add policies for authenticated users

  3. Changes
    - Create dedicated schema for checklist items separate from regular logbook entries
    - Add proper indexes and constraints
*/

-- Create logbook_checklist_items table
CREATE TABLE IF NOT EXISTS logbook_checklist_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  service_id uuid NOT NULL REFERENCES logbook_services(id),
  due_date date NOT NULL,
  end_date date,
  is_permanent boolean DEFAULT false,
  display_range boolean DEFAULT false,
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  group_id uuid REFERENCES groups(id),
  completed boolean NOT NULL DEFAULT false,
  completed_by_id uuid REFERENCES users(id),
  completed_by_name text,
  completed_at timestamptz,
  room_number text,
  tags jsonb DEFAULT '[]',
  history jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Enable RLS on the new table
ALTER TABLE logbook_checklist_items ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX idx_checklist_items_hotel_id ON logbook_checklist_items(hotel_id);
CREATE INDEX idx_checklist_items_service_id ON logbook_checklist_items(service_id);
CREATE INDEX idx_checklist_items_due_date ON logbook_checklist_items(due_date);
CREATE INDEX idx_checklist_items_completed ON logbook_checklist_items(completed);
CREATE INDEX idx_checklist_items_completed_by ON logbook_checklist_items(completed_by_id);

-- Create RLS policies for logbook_checklist_items

-- Users can read checklist items for their hotels
CREATE POLICY "Users can read checklist items for their hotels" ON logbook_checklist_items
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

-- Users can create checklist items for their hotels
CREATE POLICY "Users can create checklist items for their hotels" ON logbook_checklist_items
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

-- Users can update checklist items for their hotels
CREATE POLICY "Users can update checklist items for their hotels" ON logbook_checklist_items
  FOR UPDATE
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

-- Users can delete checklist items for their hotels
CREATE POLICY "Users can delete checklist items for their hotels" ON logbook_checklist_items
  FOR DELETE
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

-- Set up automatic group_id population from hotel_id
CREATE OR REPLACE FUNCTION set_checklist_item_group_id()
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
CREATE TRIGGER set_checklist_item_group_id
BEFORE INSERT ON logbook_checklist_items
FOR EACH ROW
EXECUTE FUNCTION set_checklist_item_group_id();