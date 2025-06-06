/*
  # Fix duplicate event reminders

  1. Database Changes
    - Add unique constraint to prevent duplicate reminders
    - Clean up existing duplicate reminders
    - Update policies for better data integrity

  2. Security
    - Maintain existing RLS policies
    - Ensure users can only manage their own reminders
*/

-- First, remove duplicate reminders, keeping only the most recent one for each user/event combination
DELETE FROM event_reminders 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, event_id) id
  FROM event_reminders
  ORDER BY user_id, event_id, created_at DESC
);

-- Add unique constraint to prevent future duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_reminders_user_event_unique' 
    AND table_name = 'event_reminders'
  ) THEN
    ALTER TABLE event_reminders 
    ADD CONSTRAINT event_reminders_user_event_unique 
    UNIQUE (user_id, event_id);
  END IF;
END $$;

-- Create index for better performance on the unique constraint
CREATE INDEX IF NOT EXISTS idx_event_reminders_user_event 
ON event_reminders (user_id, event_id);

-- Update the existing index name for consistency
DROP INDEX IF EXISTS idx_event_reminders_user_upcoming;
CREATE INDEX IF NOT EXISTS idx_event_reminders_user_upcoming 
ON event_reminders (user_id, reminder_date) 
WHERE (is_read = false);