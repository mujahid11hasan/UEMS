/*
  # Add Delete Policy for Events

  1. Changes
    - Add policy to allow teachers and admins to delete their own events
    - Ensure proper role-based access control for event deletion
*/

-- Add policy for event deletion
CREATE POLICY "Teachers and admins can delete own events"
  ON events FOR DELETE
  USING (
    created_by = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'admin')
    )
  );