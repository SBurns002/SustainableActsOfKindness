/*
  # Event Reminders System

  1. New Tables
    - `users` table for user authentication data
    - `event_reminders` table for storing user event reminders
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `event_id` (text, event identifier)
      - `event_name` (text, event display name)
      - `event_date` (timestamptz, when event occurs)
      - `reminder_date` (timestamptz, when to remind user)
      - `is_read` (boolean, whether user has seen reminder)
      - `created_at` (timestamptz, when reminder was created)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own data
    - Add policies for reminders with proper user access control

  3. Indexes
    - Efficient querying by user_id, reminder_date, and read status
*/

-- Create users table first (required for foreign key reference)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own user record
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create event_reminders table
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

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_event_reminders_user_id ON event_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_reminder_date ON event_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_event_reminders_is_read ON event_reminders(is_read);
CREATE INDEX IF NOT EXISTS idx_event_reminders_user_upcoming ON event_reminders(user_id, reminder_date) WHERE is_read = false;