/*
  # Fix Event ID References Migration

  1. Convert event_id columns from text to UUID
  2. Create proper foreign key relationships
  3. Handle existing data migration
  4. Maintain data integrity
*/

-- First, let's add temporary columns to store the new UUID references
ALTER TABLE event_participants ADD COLUMN new_event_id uuid;
ALTER TABLE event_reminders ADD COLUMN new_event_id uuid;
ALTER TABLE event_notifications ADD COLUMN new_event_id uuid;

-- Create events for existing participations that don't have corresponding events table entries
-- This handles the case where we have participations for static events that aren't in the events table yet
DO $$
DECLARE
    participation_record RECORD;
    reminder_record RECORD;
    notification_record RECORD;
    new_event_id uuid;
    current_user_id uuid;
BEGIN
    -- Get a default user ID for created_by (use the first user, or create a system user)
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    
    -- If no users exist, we'll handle this case
    IF current_user_id IS NULL THEN
        -- For now, we'll use a placeholder UUID that we'll update later
        current_user_id := '00000000-0000-0000-0000-000000000000'::uuid;
    END IF;

    -- Handle event_participants
    FOR participation_record IN 
        SELECT DISTINCT event_id FROM event_participants 
        WHERE event_id NOT IN (SELECT title FROM events)
    LOOP
        -- Check if an event with this title already exists
        SELECT id INTO new_event_id FROM events WHERE title = participation_record.event_id;
        
        IF new_event_id IS NULL THEN
            -- Create a new event entry for this participation
            INSERT INTO events (
                title,
                description,
                event_type,
                event_date,
                location,
                organizer_name,
                status,
                created_by
            ) VALUES (
                participation_record.event_id,
                'Event created from existing participation data',
                'cleanup',
                CURRENT_TIMESTAMP + INTERVAL '30 days', -- Default to 30 days from now
                'Location TBD',
                'Environmental Protection Group',
                'active',
                current_user_id
            ) RETURNING id INTO new_event_id;
        END IF;
        
        -- Update all participations with this event_id
        UPDATE event_participants 
        SET new_event_id = new_event_id 
        WHERE event_id = participation_record.event_id;
    END LOOP;

    -- Handle event_reminders
    FOR reminder_record IN 
        SELECT DISTINCT event_id FROM event_reminders 
        WHERE event_id NOT IN (SELECT title FROM events)
    LOOP
        -- Check if an event with this title already exists
        SELECT id INTO new_event_id FROM events WHERE title = reminder_record.event_id;
        
        IF new_event_id IS NULL THEN
            -- Create a new event entry for this reminder
            INSERT INTO events (
                title,
                description,
                event_type,
                event_date,
                location,
                organizer_name,
                status,
                created_by
            ) VALUES (
                reminder_record.event_id,
                'Event created from existing reminder data',
                'cleanup',
                CURRENT_TIMESTAMP + INTERVAL '30 days', -- Default to 30 days from now
                'Location TBD',
                'Environmental Protection Group',
                'active',
                current_user_id
            ) RETURNING id INTO new_event_id;
        END IF;
        
        -- Update all reminders with this event_id
        UPDATE event_reminders 
        SET new_event_id = new_event_id 
        WHERE event_id = reminder_record.event_id;
    END LOOP;

    -- Handle event_notifications
    FOR notification_record IN 
        SELECT DISTINCT event_id FROM event_notifications 
        WHERE event_id NOT IN (SELECT title FROM events)
    LOOP
        -- Check if an event with this title already exists
        SELECT id INTO new_event_id FROM events WHERE title = notification_record.event_id;
        
        IF new_event_id IS NULL THEN
            -- Create a new event entry for this notification
            INSERT INTO events (
                title,
                description,
                event_type,
                event_date,
                location,
                organizer_name,
                status,
                created_by
            ) VALUES (
                notification_record.event_id,
                'Event created from existing notification data',
                'cleanup',
                CURRENT_TIMESTAMP + INTERVAL '30 days', -- Default to 30 days from now
                'Location TBD',
                'Environmental Protection Group',
                'active',
                current_user_id
            ) RETURNING id INTO new_event_id;
        END IF;
        
        -- Update all notifications with this event_id
        UPDATE event_notifications 
        SET new_event_id = new_event_id 
        WHERE event_id = notification_record.event_id;
    END LOOP;

    -- Now handle existing events - map by title
    UPDATE event_participants 
    SET new_event_id = events.id 
    FROM events 
    WHERE event_participants.event_id = events.title 
    AND event_participants.new_event_id IS NULL;

    UPDATE event_reminders 
    SET new_event_id = events.id 
    FROM events 
    WHERE event_reminders.event_id = events.title 
    AND event_reminders.new_event_id IS NULL;

    UPDATE event_notifications 
    SET new_event_id = events.id 
    FROM events 
    WHERE event_notifications.event_id = events.title 
    AND event_notifications.new_event_id IS NULL;
END $$;

-- Drop constraints properly (not indexes directly)
ALTER TABLE event_participants DROP CONSTRAINT IF EXISTS event_participants_user_id_event_id_key;
ALTER TABLE event_reminders DROP CONSTRAINT IF EXISTS event_reminders_user_event_unique;

-- Drop any remaining indexes that might exist
DROP INDEX IF EXISTS idx_event_participants_user_event;
DROP INDEX IF EXISTS idx_event_reminders_user_event;

-- Now replace the old event_id columns
ALTER TABLE event_participants DROP COLUMN event_id;
ALTER TABLE event_participants RENAME COLUMN new_event_id TO event_id;
ALTER TABLE event_participants ALTER COLUMN event_id SET NOT NULL;

ALTER TABLE event_reminders DROP COLUMN event_id;
ALTER TABLE event_reminders RENAME COLUMN new_event_id TO event_id;
ALTER TABLE event_reminders ALTER COLUMN event_id SET NOT NULL;

ALTER TABLE event_notifications DROP COLUMN event_id;
ALTER TABLE event_notifications RENAME COLUMN new_event_id TO event_id;
ALTER TABLE event_notifications ALTER COLUMN event_id SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE event_participants 
ADD CONSTRAINT event_participants_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE event_reminders 
ADD CONSTRAINT event_reminders_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

ALTER TABLE event_notifications 
ADD CONSTRAINT event_notifications_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Recreate unique constraints
ALTER TABLE event_participants 
ADD CONSTRAINT event_participants_user_id_event_id_key 
UNIQUE (user_id, event_id);

ALTER TABLE event_reminders 
ADD CONSTRAINT event_reminders_user_event_unique 
UNIQUE (user_id, event_id);

-- Recreate indexes for performance
CREATE INDEX idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_event_reminders_event_id ON event_reminders(event_id);
CREATE INDEX idx_event_notifications_event_id ON event_notifications(event_id);
CREATE INDEX idx_event_participants_user_event ON event_participants(user_id, event_id);
CREATE INDEX idx_event_reminders_user_event ON event_reminders(user_id, event_id);