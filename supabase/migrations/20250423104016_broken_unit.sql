/*
  # Add Venues Management

  1. New Tables
    - `venues`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `address` (text)
      - `capacity` (integer)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for admin access
    - Add policy for public read access
*/

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  address text NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Venues policies
CREATE POLICY "Venues are viewable by everyone"
  ON venues FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create venues"
  ON venues FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update venues"
  ON venues FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete venues"
  ON venues FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
    AND NOT EXISTS (
      SELECT 1 FROM events
      WHERE events.venue = venues.name
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_venues_updated_at
    BEFORE UPDATE ON venues
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();