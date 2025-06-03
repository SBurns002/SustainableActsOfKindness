/*
  # Event Management Schema

  1. New Tables
    - `event_participants`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `event_id` (text, references events)
      - `created_at` (timestamp)
      - `notification_preferences` (jsonb)
    - `event_notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `event_id` (text, references events)
      - `type` (text)
      - `sent_at` (timestamp)
      - `scheduled_for` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  event_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  notification_preferences jsonb DEFAULT '{"email": true, "push": false}'::jsonb,
  UNIQUE(user_id, event_id)
);

-- Create event_notifications table
CREATE TABLE IF NOT EXISTS event_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  event_id text NOT NULL,
  type text NOT NULL,
  sent_at timestamptz,
  scheduled_for timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for event_participants
CREATE POLICY "Users can view their own participations"
  ON event_participants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join events"
  ON event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their notification preferences"
  ON event_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for event_notifications
CREATE POLICY "Users can view their own notifications"
  ON event_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);