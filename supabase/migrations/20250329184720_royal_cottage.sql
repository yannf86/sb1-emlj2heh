/*
  # Add Hotel Locations Mapping

  1. New Tables
    - hotel_locations
      - id (uuid, primary key)
      - hotel_id (uuid, references hotels)
      - location_id (uuid, references parameters)
      - active (boolean)
      - created_at (timestamptz)
      - updated_at (timestamptz)
      - created_by (uuid)
      - updated_by (uuid)

  2. Security
    - Enable RLS on hotel_locations table
    - Add policies for authenticated users

  3. Changes
    - Add unique constraint on hotel_id and location_id
    - Add indexes for better performance
*/

-- Create hotel_locations table
CREATE TABLE IF NOT EXISTS hotel_locations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES parameters(id) ON DELETE CASCADE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  UNIQUE(hotel_id, location_id)
);

-- Enable RLS
ALTER TABLE hotel_locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read hotel locations" ON hotel_locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (u.role = 'admin' OR hotel_id = ANY(u.hotels))
    )
  );

CREATE POLICY "Admins can modify hotel locations" ON hotel_locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX idx_hotel_locations_hotel_id ON hotel_locations(hotel_id);
CREATE INDEX idx_hotel_locations_location_id ON hotel_locations(location_id);