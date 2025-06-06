/*
  # Create Administrator System

  1. New Tables
    - `user_roles` - Stores user role assignments (admin, user)
    - `events` - Stores all sustainability events with full details
    - `event_categories` - Predefined event categories
    
  2. Security
    - Enable RLS on all new tables
    - Add policies for admin access and user read access
    - Ensure proper data isolation
    
  3. Admin Features
    - Role-based access control
    - Event CRUD operations
    - Category management
*/

-- Create user roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'user')),
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create event categories table
CREATE TABLE IF NOT EXISTS event_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  color text NOT NULL DEFAULT '#10b981',
  icon text DEFAULT 'leaf',
  created_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES event_categories(id),
  event_type text NOT NULL CHECK (event_type IN ('cleanup', 'treePlanting', 'garden', 'education', 'workshop')),
  event_date timestamptz NOT NULL,
  start_time text,
  end_time text,
  location text NOT NULL,
  address text,
  coordinates jsonb, -- {lat: number, lng: number}
  max_participants integer,
  current_participants integer DEFAULT 0,
  requirements text[],
  what_to_bring text[],
  organizer_name text NOT NULL DEFAULT 'Environmental Protection Group',
  organizer_contact text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'draft')),
  metadata jsonb DEFAULT '{}', -- For storing additional event-specific data like trees count, plots, etc.
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Event categories policies
CREATE POLICY "Anyone can view event categories"
  ON event_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage event categories"
  ON event_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Events policies
CREATE POLICY "Anyone can view active events"
  ON events
  FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Admins can manage all events"
  ON events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

-- Insert default event categories
INSERT INTO event_categories (name, description, color, icon) VALUES
  ('Environmental Cleanup', 'Beach, river, and park cleanup events', '#3b82f6', 'trash-2'),
  ('Tree Planting', 'Urban and forest reforestation initiatives', '#10b981', 'tree-pine'),
  ('Community Garden', 'Sustainable urban agriculture projects', '#f59e0b', 'flower-2'),
  ('Education & Workshops', 'Environmental education and skill-building', '#8b5cf6', 'book-open'),
  ('Conservation', 'Wildlife and habitat conservation efforts', '#059669', 'leaf')
ON CONFLICT (name) DO NOTHING;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND role = 'admin'
  );
$$;

-- Create function to update event participant count
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events 
    SET current_participants = current_participants + 1,
        updated_at = now()
    WHERE id = NEW.event_id::uuid;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events 
    SET current_participants = GREATEST(current_participants - 1, 0),
        updated_at = now()
    WHERE id = OLD.event_id::uuid;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger to automatically update participant counts
DROP TRIGGER IF EXISTS update_event_participants_trigger ON event_participants;
CREATE TRIGGER update_event_participants_trigger
  AFTER INSERT OR DELETE ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_event_participant_count();

-- Create updated_at trigger for events
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_category_id ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT ALL ON event_categories TO authenticated;
GRANT ALL ON events TO authenticated;