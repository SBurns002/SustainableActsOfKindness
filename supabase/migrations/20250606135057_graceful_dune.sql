/*
  # Fix User Relationships and Event Participation

  This migration ensures proper relationships between auth.users and event participation tables.

  1. Tables
    - Ensures event_participants references auth.users correctly
    - Ensures event_reminders references auth.users correctly
    - Removes any conflicting public.users table

  2. Security
    - Maintains RLS policies
    - Ensures proper user access controls

  3. Data Integrity
    - Adds proper foreign key constraints
    - Ensures data consistency
*/

-- Drop the public.users table if it exists (we use auth.users instead)
DROP TABLE IF EXISTS public.users CASCADE;

-- Ensure event_participants table has correct structure
DO $$
BEGIN
  -- Check if event_participants table exists and has correct foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_participants_user_id_fkey' 
    AND table_name = 'event_participants'
  ) THEN
    -- Drop existing foreign key if it exists with wrong reference
    ALTER TABLE IF EXISTS event_participants 
    DROP CONSTRAINT IF EXISTS event_participants_user_id_fkey;
    
    -- Add correct foreign key to auth.users
    ALTER TABLE event_participants 
    ADD CONSTRAINT event_participants_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure event_reminders table has correct structure
DO $$
BEGIN
  -- Check if event_reminders table exists and has correct foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_reminders_user_id_fkey' 
    AND table_name = 'event_reminders'
  ) THEN
    -- Drop existing foreign key if it exists with wrong reference
    ALTER TABLE IF EXISTS event_reminders 
    DROP CONSTRAINT IF EXISTS event_reminders_user_id_fkey;
    
    -- Add correct foreign key to auth.users
    ALTER TABLE event_reminders 
    ADD CONSTRAINT event_reminders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure event_notifications table has correct structure
DO $$
BEGIN
  -- Check if event_notifications table exists and has correct foreign key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_notifications_user_id_fkey' 
    AND table_name = 'event_notifications'
  ) THEN
    -- Drop existing foreign key if it exists with wrong reference
    ALTER TABLE IF EXISTS event_notifications 
    DROP CONSTRAINT IF EXISTS event_notifications_user_id_fkey;
    
    -- Add correct foreign key to auth.users
    ALTER TABLE event_notifications 
    ADD CONSTRAINT event_notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure RLS is enabled on all tables
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;

-- Update RLS policies to use auth.uid() correctly
DROP POLICY IF EXISTS "Users can insert own data" ON event_participants;
DROP POLICY IF EXISTS "Users can read own data" ON event_participants;
DROP POLICY IF EXISTS "Users can update own data" ON event_participants;
DROP POLICY IF EXISTS "Users can join events" ON event_participants;
DROP POLICY IF EXISTS "Users can update their notification preferences" ON event_participants;
DROP POLICY IF EXISTS "Users can view their own participations" ON event_participants;

-- Create correct policies for event_participants
CREATE POLICY "Users can join events"
  ON event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own participations"
  ON event_participants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notification preferences"
  ON event_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave events"
  ON event_participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update RLS policies for event_reminders
DROP POLICY IF EXISTS "System can insert reminders" ON event_reminders;
DROP POLICY IF EXISTS "Users can read own reminders" ON event_reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON event_reminders;

CREATE POLICY "Users can create reminders"
  ON event_reminders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "Users can delete own reminders"
  ON event_reminders
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update RLS policies for event_notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON event_notifications;

CREATE POLICY "Users can view their own notifications"
  ON event_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);