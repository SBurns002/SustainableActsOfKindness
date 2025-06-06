/*
  # Fix foreign key constraint for event_reminders table

  1. Changes
    - Drop the existing foreign key constraint that references public.users
    - Add a new foreign key constraint that references auth.users like other tables
  
  2. Security
    - No changes to RLS policies needed as they already work correctly
  
  This fixes the constraint violation error when creating event reminders.
*/

-- Drop the existing foreign key constraint
ALTER TABLE event_reminders 
DROP CONSTRAINT IF EXISTS event_reminders_user_id_fkey;

-- Add the correct foreign key constraint referencing auth.users
ALTER TABLE event_reminders 
ADD CONSTRAINT event_reminders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;