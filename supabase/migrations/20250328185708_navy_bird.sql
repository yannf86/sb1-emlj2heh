/*
  # Initial Schema Setup

  1. New Tables
    - users
    - hotels
    - parameters
    - incidents
    - maintenance_requests
    - quality_visits
    - lost_items
    - procedures
    - suppliers
    - user_stats
    - badges
    - challenges
    - audit_logs

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Changes
    - Initial schema creation
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'standard')),
  hotels text[] NOT NULL DEFAULT '{}',
  modules text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  last_login timestamptz,
  preferences jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Create hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  image_url text,
  available_locations text[] DEFAULT '{}',
  available_room_types text[] DEFAULT '{}',
  settings jsonb,
  contacts jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Create parameters table
CREATE TABLE IF NOT EXISTS parameters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL,
  code text NOT NULL,
  label text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  "order" integer NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  UNIQUE (type, code)
);

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  time time NOT NULL,
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  location_id uuid NOT NULL REFERENCES parameters(id),
  room_type uuid REFERENCES parameters(id),
  client_name text,
  client_email text,
  client_phone text,
  arrival_date date,
  departure_date date,
  reservation_amount decimal,
  origin uuid REFERENCES parameters(id),
  category_id uuid NOT NULL REFERENCES parameters(id),
  impact_id uuid NOT NULL REFERENCES parameters(id),
  description text NOT NULL,
  status_id uuid NOT NULL REFERENCES parameters(id),
  received_by_id uuid NOT NULL REFERENCES users(id),
  concluded_by_id uuid REFERENCES users(id),
  resolution jsonb,
  attachments jsonb,
  history jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Create maintenance_requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  time time NOT NULL,
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  location_id uuid NOT NULL REFERENCES parameters(id),
  intervention_type_id uuid NOT NULL REFERENCES parameters(id),
  description text NOT NULL,
  received_by_id uuid NOT NULL REFERENCES users(id),
  technician_id uuid REFERENCES users(id),
  status_id uuid NOT NULL REFERENCES parameters(id),
  estimated_amount decimal,
  final_amount decimal,
  start_date date,
  end_date date,
  photo_before text,
  photo_after text,
  quote jsonb,
  parts jsonb,
  history jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Create quality_visits table
CREATE TABLE IF NOT EXISTS quality_visits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  visitor_id uuid NOT NULL REFERENCES users(id),
  local_referent_id uuid REFERENCES users(id),
  visit_type_id uuid NOT NULL REFERENCES parameters(id),
  checklist jsonb NOT NULL,
  remarks text,
  action_plan text,
  conformity_rate integer NOT NULL,
  photos jsonb,
  history jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Create lost_items table
CREATE TABLE IF NOT EXISTS lost_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  date date NOT NULL,
  time time NOT NULL,
  hotel_id uuid NOT NULL REFERENCES hotels(id),
  location_id uuid NOT NULL REFERENCES parameters(id),
  description text NOT NULL,
  item_type_id uuid NOT NULL REFERENCES parameters(id),
  found_by_id uuid NOT NULL REFERENCES users(id),
  storage_location text NOT NULL,
  status text NOT NULL CHECK (status IN ('conservé', 'rendu', 'transféré')),
  returned_to text,
  return_date date,
  photos text[],
  history jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Create procedures table
CREATE TABLE IF NOT EXISTS procedures (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  file_url text NOT NULL,
  module_id uuid NOT NULL REFERENCES modules(id),
  hotel_ids uuid[] NOT NULL,
  type_id uuid NOT NULL REFERENCES parameters(id),
  service_id uuid NOT NULL REFERENCES hotel_services(id),
  assigned_user_ids uuid[] NOT NULL,
  content text,
  version integer NOT NULL DEFAULT 1,
  user_reads jsonb,
  attachments jsonb,
  history jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name text NOT NULL,
  description text NOT NULL,
  subcategory_id uuid NOT NULL REFERENCES supplier_subcategories(id),
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  website text,
  active boolean NOT NULL DEFAULT true,
  hotel_ids uuid[] NOT NULL,
  contacts jsonb,
  contracts jsonb,
  ratings jsonb,
  history jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  badges text[] NOT NULL DEFAULT '{}',
  stats jsonb NOT NULL DEFAULT '{}',
  history jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  tier integer NOT NULL CHECK (tier IN (1, 2, 3)),
  hidden boolean NOT NULL DEFAULT false,
  requirements jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  xp_reward integer NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  requirements jsonb NOT NULL,
  participants jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_name text NOT NULL,
  document_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  changes jsonb NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id),
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own data and admins can read all
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Only admins can modify user data
CREATE POLICY "Admins can modify user data" ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Users can read hotels they have access to
CREATE POLICY "Users can read assigned hotels" ON hotels
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (u.role = 'admin' OR hotels.id = ANY(u.hotels))
    )
  );

-- Only admins can modify hotel data
CREATE POLICY "Admins can modify hotel data" ON hotels
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- All authenticated users can read parameters
CREATE POLICY "Users can read parameters" ON parameters
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify parameters
CREATE POLICY "Admins can modify parameters" ON parameters
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Users can read incidents from their hotels
CREATE POLICY "Users can read hotel incidents" ON incidents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (u.role = 'admin' OR incidents.hotel_id = ANY(u.hotels))
    )
  );

-- Users can create/update incidents for their hotels
CREATE POLICY "Users can manage hotel incidents" ON incidents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (u.role = 'admin' OR incidents.hotel_id = ANY(u.hotels))
    )
  );

-- Similar policies for other tables...
-- (Add policies for maintenance_requests, quality_visits, lost_items, procedures, suppliers)

-- Users can read their own stats
CREATE POLICY "Users can read own stats" ON user_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System can update user stats
CREATE POLICY "System can update user stats" ON user_stats
  FOR ALL
  TO authenticated
  USING (true);

-- All users can read badges
CREATE POLICY "Users can read badges" ON badges
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify badges
CREATE POLICY "Admins can modify badges" ON badges
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- All users can read challenges
CREATE POLICY "Users can read challenges" ON challenges
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify challenges
CREATE POLICY "Admins can modify challenges" ON challenges
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );