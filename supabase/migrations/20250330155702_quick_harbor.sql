/*
  # Separate Parameters into Type-Specific Collections

  1. New Tables
    - parameters_incident_category: For incident categories
    - parameters_impact: For impact levels
    - parameters_status: For status values
    - parameters_intervention_type: For maintenance intervention types
    - parameters_visit_type: For quality visit types
    - parameters_quality_category: For quality check categories
    - parameters_quality_item: For quality check items
    - parameters_lost_item_type: For lost item types
    - parameters_procedure_type: For procedure types
    - parameters_booking_origin: For booking origins

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users

  3. Changes
    - Create new tables for each parameter type
    - Add appropriate indexes and constraints
*/

-- Create parameters_incident_category table
CREATE TABLE IF NOT EXISTS parameters_incident_category (
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

-- Create parameters_impact table
CREATE TABLE IF NOT EXISTS parameters_impact (
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

-- Create parameters_status table
CREATE TABLE IF NOT EXISTS parameters_status (
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

-- Create parameters_intervention_type table
CREATE TABLE IF NOT EXISTS parameters_intervention_type (
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

-- Create parameters_visit_type table
CREATE TABLE IF NOT EXISTS parameters_visit_type (
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

-- Create parameters_quality_category table
CREATE TABLE IF NOT EXISTS parameters_quality_category (
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

-- Create parameters_quality_item table
CREATE TABLE IF NOT EXISTS parameters_quality_item (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text NOT NULL,
  label text NOT NULL,
  category_id uuid NOT NULL REFERENCES parameters_quality_category(id),
  active boolean NOT NULL DEFAULT true,
  "order" integer NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  UNIQUE (code)
);

-- Create parameters_lost_item_type table
CREATE TABLE IF NOT EXISTS parameters_lost_item_type (
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

-- Create parameters_procedure_type table
CREATE TABLE IF NOT EXISTS parameters_procedure_type (
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

-- Create parameters_booking_origin table
CREATE TABLE IF NOT EXISTS parameters_booking_origin (
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

-- Enable RLS on all new tables
ALTER TABLE parameters_incident_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters_impact ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters_intervention_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters_visit_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters_quality_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters_quality_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters_lost_item_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters_procedure_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters_booking_origin ENABLE ROW LEVEL SECURITY;

-- Create policies for each table
-- All authenticated users can read parameters
-- Only admins can modify parameters

-- Incident Categories
CREATE POLICY "Users can read incident categories" ON parameters_incident_category
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify incident categories" ON parameters_incident_category
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Impact Levels
CREATE POLICY "Users can read impact levels" ON parameters_impact
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify impact levels" ON parameters_impact
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Status Values
CREATE POLICY "Users can read status values" ON parameters_status
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify status values" ON parameters_status
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Intervention Types
CREATE POLICY "Users can read intervention types" ON parameters_intervention_type
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify intervention types" ON parameters_intervention_type
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Visit Types
CREATE POLICY "Users can read visit types" ON parameters_visit_type
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify visit types" ON parameters_visit_type
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Quality Categories
CREATE POLICY "Users can read quality categories" ON parameters_quality_category
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify quality categories" ON parameters_quality_category
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Quality Items
CREATE POLICY "Users can read quality items" ON parameters_quality_item
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify quality items" ON parameters_quality_item
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Lost Item Types
CREATE POLICY "Users can read lost item types" ON parameters_lost_item_type
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify lost item types" ON parameters_lost_item_type
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Procedure Types
CREATE POLICY "Users can read procedure types" ON parameters_procedure_type
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify procedure types" ON parameters_procedure_type
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Booking Origins
CREATE POLICY "Users can read booking origins" ON parameters_booking_origin
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify booking origins" ON parameters_booking_origin
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Create indexes for better query performance
CREATE INDEX idx_incident_category_code ON parameters_incident_category(code);
CREATE INDEX idx_impact_code ON parameters_impact(code);
CREATE INDEX idx_status_code ON parameters_status(code);
CREATE INDEX idx_intervention_type_code ON parameters_intervention_type(code);
CREATE INDEX idx_visit_type_code ON parameters_visit_type(code);
CREATE INDEX idx_quality_category_code ON parameters_quality_category(code);
CREATE INDEX idx_quality_item_code ON parameters_quality_item(code);
CREATE INDEX idx_quality_item_category ON parameters_quality_item(category_id);
CREATE INDEX idx_lost_item_type_code ON parameters_lost_item_type(code);
CREATE INDEX idx_procedure_type_code ON parameters_procedure_type(code);
CREATE INDEX idx_booking_origin_code ON parameters_booking_origin(code);