/*
  # Add Maintenance Quotes Schema

  1. New Tables
    - technicians
      - id (uuid, primary key)
      - name (text)
      - email (text)
      - phone (text)
      - company (text)
      - specialties (text)
      - hourly_rate (decimal)
      - hotels (text array)
      - available (boolean)
      - active (boolean)
      - rating (decimal)
      - completed_jobs (integer)

  2. Changes to Existing Tables
    - ALTER TABLE maintenance_requests
      - Add technicianIds (text array)
      - Add quotes (jsonb)

  3. Security
    - Enable RLS on technicians table
    - Add policies for authenticated users
    - Enable RLS policies for maintenance_requests to allow technicians access
*/

-- Create technicians table
CREATE TABLE IF NOT EXISTS technicians (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  company text,
  specialties text,
  hourly_rate decimal,
  hotels text[] NOT NULL DEFAULT '{}',
  available boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  rating decimal NOT NULL DEFAULT 0,
  completed_jobs integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Add technician_ids array and quotes json field to maintenance_requests table
DO $$
BEGIN
  -- Check if technician_ids column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_requests' AND column_name = 'technician_ids'
  ) THEN
    ALTER TABLE maintenance_requests ADD COLUMN technician_ids text[] DEFAULT '{}';
  END IF;

  -- Check if quotes column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_requests' AND column_name = 'quotes'
  ) THEN
    ALTER TABLE maintenance_requests ADD COLUMN quotes jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Enable RLS on technicians table
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for technicians
CREATE POLICY "Users can read technicians" ON technicians
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can modify technicians" ON technicians
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Enable RLS on maintenance_requests if not already enabled
DO $$
BEGIN
  EXECUTE 'ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;';
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create RLS policies for maintenance_requests for technicians
CREATE POLICY "Technicians can view assigned maintenance requests" ON maintenance_requests
  FOR SELECT
  TO authenticated
  USING (
    -- Admins can read all requests
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
    OR 
    -- Technicians can read requests assigned to them
    auth.uid()::text = ANY(technician_ids)
    OR
    -- Technicians can read requests for hotels they are assigned to
    EXISTS (
      SELECT 1 FROM technicians t
      WHERE t.id = auth.uid() AND 
      (
        -- Check if the hotel_id of the maintenance request exists in the technician's hotels array
        maintenance_requests.hotel_id::text = ANY(t.hotels) OR
        -- For backward compatibility, in case hotel is stored differently
        maintenance_requests.hotel = ANY(t.hotels)
      )
    )
  );

CREATE POLICY "Technicians can update assigned maintenance requests" ON maintenance_requests
  FOR UPDATE
  TO authenticated
  USING (
    -- Admins can update all requests
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
    OR 
    -- Technicians can update requests assigned to them
    auth.uid()::text = ANY(technician_ids)
  );

-- Create indexes
CREATE INDEX idx_technicians_email ON technicians(email);
CREATE INDEX idx_technicians_hotels ON technicians USING GIN(hotels);
CREATE INDEX idx_maintenance_requests_technician_ids ON maintenance_requests USING GIN(technician_ids);