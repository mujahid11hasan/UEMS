/*
  # Add phone column to registrations table

  1. Changes
    - Add `phone` column to `registrations` table
      - Type: text
      - Nullable: true (to maintain compatibility with existing records)

  2. Notes
    - Using DO block to safely add column if it doesn't exist
    - No data migration needed as this is a new optional field
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'registrations' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE registrations ADD COLUMN phone text;
  END IF;
END $$;