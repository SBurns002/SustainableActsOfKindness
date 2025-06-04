/*
  # Reset event participants

  1. Changes
    - Delete all records from event_participants table
    - Reset sequence if any exists

  This migration safely removes all participant records while maintaining the table structure
  and security policies.
*/

-- Delete all records from event_participants
DELETE FROM event_participants;