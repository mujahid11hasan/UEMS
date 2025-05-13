/*
  # Add Event Image Support

  1. Changes
    - Add image_url column to events table
    - Allow NULL values for backward compatibility
*/

ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url text;