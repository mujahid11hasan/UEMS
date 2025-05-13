/*
  # Add Admin Event Management Policy

  1. Changes
    - Add policy to allow admins to delete any event
    - Add policy to allow admins to update any event
*/

-- Add policy for admin event deletion
CREATE POLICY "Admins can delete any event"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add policy for admin event updates
CREATE POLICY "Admins can update any event"
  ON events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );