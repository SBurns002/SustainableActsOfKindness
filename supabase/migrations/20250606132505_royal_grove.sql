/*
  # Create event reminders system

  1. New Tables
    - `event_reminders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `event_id` (text, references event)
      - `event_name` (text, event display name)
      - `event_date` (timestamp, when the event occurs)
      - `reminder_date` (timestamp, when to show reminder)
      - `is_read` (boolean, whether user has seen the reminder)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `event_reminders` table
    - Add policy for users to read/update their own reminders
*/

CREATE TABLE IF NOT EXISTS event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  event_name text NOT NULL,
  event_date timestamptz NOT NULL,
  reminder_date timestamptz NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reminders"
  ON event_reminders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON event_reminders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert reminders"
  ON event_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_event_reminders_user_id ON event_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_reminder_date ON event_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_event_reminders_is_read ON event_reminders(is_read);