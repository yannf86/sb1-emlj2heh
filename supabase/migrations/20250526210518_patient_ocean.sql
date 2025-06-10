/*
  # Add Room Types Parameter Collection

  1. New Tables
    - parameters_room_type: For storing room type parameters

  2. Security
    - Enable RLS on the new table
    - Add policies for authenticated users

  3. Changes
    - Create a new table for room type parameters
    - Add appropriate indexes and constraints
*/

-- Create parameters_room_type table
CREATE TABLE IF NOT EXISTS parameters_room_type (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text NOT NULL,
  label text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  "order" integer NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  UNIQUE (code)
);

-- Enable RLS on the new table
ALTER TABLE parameters_room_type ENABLE ROW LEVEL SECURITY;

-- Create policies for the new table
-- All authenticated users can read parameters
CREATE POLICY "Users can read room type parameters" ON parameters_room_type
  FOR SELECT TO authenticated USING (true);

-- Only admins can modify parameters
CREATE POLICY "Admins can modify room type parameters" ON parameters_room_type
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND (u.role = 'admin' OR u.role = 'hotel_admin')
    )
  );

-- Create indexes for better query performance
CREATE INDEX idx_room_type_code ON parameters_room_type(code);