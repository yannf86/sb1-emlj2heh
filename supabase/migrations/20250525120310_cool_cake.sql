/*
  # Add Email Tables for User Management

  1. New Tables
    - emails
      - id (uuid, primary key)
      - email (text, recipient email)
      - subject (text, email subject)
      - content (text, email content in HTML format)
      - sent_at (timestamptz, when the email was sent)
      - status (text, email status)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS on emails table
    - Add policies for authenticated users

  3. Changes
    - Create emails table for user welcome emails and notifications
    - Add appropriate indexes and constraints
*/

-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can read all emails" ON emails
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Service role can insert emails" ON emails
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create index for searching emails
CREATE INDEX idx_emails_email ON emails(email);
CREATE INDEX idx_emails_status ON emails(status);
CREATE INDEX idx_emails_created_at ON emails(created_at);