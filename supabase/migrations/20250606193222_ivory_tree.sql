/*
  # Populate Admin Dashboard with Map Events

  1. New Tables
    - Populates events table with all map data from cleanupData
    - Adds user management functionality for admins
    
  2. Security
    - Maintains existing RLS policies
    - Adds admin user management functions
    
  3. Data Population
    - Converts all map events to database events
    - Ensures proper categorization and metadata
*/

-- First, let's ensure we have a default admin user to create events
DO $$
DECLARE
  admin_user_id uuid;
  default_category_id uuid;
  event_record RECORD;
BEGIN
  -- Get the first admin user
  SELECT user_id INTO admin_user_id
  FROM user_roles
  WHERE role = 'admin'
  LIMIT 1;

  -- If no admin exists, we can't proceed
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'No admin user found. Events will be created when an admin user exists.';
    RETURN;
  END IF;

  -- Get default category (Environmental Cleanup)
  SELECT id INTO default_category_id
  FROM event_categories
  WHERE name = 'Environmental Cleanup'
  LIMIT 1;

  -- If no category exists, create one
  IF default_category_id IS NULL THEN
    INSERT INTO event_categories (name, description, color, icon)
    VALUES ('Environmental Cleanup', 'Beach, river, and park cleanup events', '#3b82f6', 'trash-2')
    RETURNING id INTO default_category_id;
  END IF;

  -- Clear existing events to avoid duplicates
  DELETE FROM events WHERE created_by = admin_user_id;

  -- Insert all the map events
  INSERT INTO events (
    title, description, category_id, event_type, event_date, start_time, end_time,
    location, address, max_participants, requirements, what_to_bring,
    organizer_name, organizer_contact, status, metadata, created_by
  ) VALUES
  -- Charles River Cleanup Initiative
  (
    'Charles River Cleanup Initiative',
    'Urban river cleanup focusing on plastic pollution and industrial runoff in the Charles River.',
    default_category_id,
    'cleanup',
    '2025-07-05 09:00:00+00',
    '9:00 AM',
    '3:00 PM',
    'Charles River Esplanade, Boston, MA',
    '100 Storrow Drive, Boston, MA 02116',
    100,
    ARRAY['Wear appropriate clothing for outdoor work', 'Bring water and snacks', 'Sunscreen and hat recommended'],
    ARRAY['Work gloves', 'Reusable water bottle', 'Sunscreen', 'Hat'],
    'Environmental Protection Group',
    'contact@environmentalprotection.org',
    'active',
    '{"priority": "high", "type": "Water Pollution"}',
    admin_user_id
  ),
  -- Boston Harbor Islands Restoration
  (
    'Boston Harbor Islands Restoration',
    'Marine ecosystem restoration and debris removal around Boston Harbor Islands.',
    default_category_id,
    'cleanup',
    '2025-07-15 08:30:00+00',
    '8:30 AM',
    '4:30 PM',
    'Spectacle Island, Boston Harbor',
    'Ferry departure from Long Wharf, Boston, MA 02110',
    75,
    ARRAY['Ferry transportation included', 'Wear sturdy shoes', 'Bring lunch and water'],
    ARRAY['Work gloves', 'Lunch', 'Water bottle', 'Sunscreen'],
    'Boston Harbor Islands Partnership',
    'info@bostonharborislands.org',
    'active',
    '{"priority": "medium", "type": "Mixed Pollution"}',
    admin_user_id
  ),
  -- Salem Harbor Waterfront Cleanup
  (
    'Salem Harbor Waterfront Cleanup',
    'Historic harbor cleanup focusing on marine debris and waterfront restoration in Salem''s historic port area.',
    default_category_id,
    'cleanup',
    '2025-07-12 08:00:00+00',
    '8:00 AM',
    '4:00 PM',
    'Salem Harbor, Salem, MA',
    'Derby Wharf, 174 Derby St, Salem, MA 01970',
    80,
    ARRAY['Marine environment work', 'Safety briefing required', 'Weather dependent'],
    ARRAY['Work boots', 'Gloves', 'Rain gear', 'Water bottle'],
    'Salem Maritime Heritage',
    'cleanup@salemheritage.org',
    'active',
    '{"priority": "high", "type": "Marine Pollution"}',
    admin_user_id
  ),
  -- Attleboro Springs Wetland Restoration
  (
    'Attleboro Springs Wetland Restoration',
    'Wetland habitat restoration and invasive species removal in the Attleboro Springs area.',
    default_category_id,
    'cleanup',
    '2025-07-26 08:30:00+00',
    '8:30 AM',
    '3:30 PM',
    'Attleboro Springs Wildlife Sanctuary',
    'Attleboro Springs Wildlife Sanctuary, North Attleborough, MA 02760',
    60,
    ARRAY['Wetland work experience helpful', 'Waterproof boots required', 'Insect repellent recommended'],
    ARRAY['Waterproof boots', 'Gloves', 'Insect repellent', 'Long pants'],
    'Attleboro Land Trust',
    'restoration@attleborolandtrust.org',
    'active',
    '{"priority": "high", "type": "Habitat Restoration"}',
    admin_user_id
  ),
  -- Ten Mile River Cleanup
  (
    'Ten Mile River Cleanup',
    'River cleanup and water quality improvement project along the Ten Mile River in Attleboro.',
    default_category_id,
    'cleanup',
    '2025-08-16 09:00:00+00',
    '9:00 AM',
    '3:00 PM',
    'Ten Mile River, Attleboro, MA',
    'Capron Park, 201 County St, Attleboro, MA 02703',
    50,
    ARRAY['River access work', 'Swimming ability recommended', 'Safety equipment provided'],
    ARRAY['Quick-dry clothing', 'Water shoes', 'Towel', 'Change of clothes'],
    'Ten Mile River Watershed Council',
    'info@tenmileriver.org',
    'active',
    '{"priority": "medium", "type": "Water Pollution"}',
    admin_user_id
  ),
  -- Middlesex Fells Reservation Cleanup
  (
    'Middlesex Fells Reservation Cleanup',
    'Large-scale forest cleanup and trail maintenance in the Middlesex Fells Reservation.',
    default_category_id,
    'cleanup',
    '2025-08-05 08:00:00+00',
    '8:00 AM',
    '4:00 PM',
    'Middlesex Fells Reservation, Medford, MA',
    '4 Woodland Rd, Stoneham, MA 02180',
    120,
    ARRAY['Forest hiking experience', 'Physical fitness required', 'Trail work'],
    ARRAY['Hiking boots', 'Work gloves', 'Backpack', 'Trail snacks'],
    'Friends of the Fells',
    'volunteer@friendsofthefells.org',
    'active',
    '{"priority": "medium", "type": "Forest Restoration"}',
    admin_user_id
  ),
  -- Walden Pond State Reservation
  (
    'Walden Pond State Reservation',
    'Environmental restoration of Thoreau''s famous Walden Pond and surrounding conservation area.',
    default_category_id,
    'cleanup',
    '2025-07-19 07:30:00+00',
    '7:30 AM',
    '3:30 PM',
    'Walden Pond State Reservation, Concord, MA',
    '915 Walden St, Concord, MA 01742',
    90,
    ARRAY['Historic site respect required', 'Early morning start', 'Parking limited'],
    ARRAY['Comfortable walking shoes', 'Water bottle', 'Light breakfast', 'Camera optional'],
    'Walden Pond State Reservation',
    'walden@mass.gov',
    'active',
    '{"priority": "high", "type": "Historic Site Restoration"}',
    admin_user_id
  ),
  -- Quabbin Reservoir Forest Restoration
  (
    'Quabbin Reservoir Forest Restoration',
    'Watershed protection and forest restoration around Massachusetts'' largest water supply.',
    default_category_id,
    'cleanup',
    '2025-08-23 08:00:00+00',
    '8:00 AM',
    '5:00 PM',
    'Quabbin Reservoir, Belchertown, MA',
    '485 Ware Rd, Belchertown, MA 01007',
    150,
    ARRAY['Full day commitment', 'Watershed protection protocols', 'Transportation to sites'],
    ARRAY['Lunch', 'Work boots', 'Layers for weather', 'Personal water supply'],
    'Massachusetts Water Resources Authority',
    'quabbin@mwra.state.ma.us',
    'active',
    '{"priority": "high", "type": "Watershed Protection"}',
    admin_user_id
  ),
  -- Cape Cod National Seashore Cleanup
  (
    'Cape Cod National Seashore Cleanup',
    'Beach cleanup and dune restoration along Cape Cod''s pristine coastline.',
    default_category_id,
    'cleanup',
    '2025-08-09 09:00:00+00',
    '9:00 AM',
    '4:00 PM',
    'Cape Cod National Seashore, Eastham, MA',
    '99 Marconi Site Rd, Wellfleet, MA 02667',
    100,
    ARRAY['Beach environment work', 'Sun protection essential', 'Tide schedule dependent'],
    ARRAY['Sunscreen', 'Hat', 'Beach shoes', 'Plenty of water'],
    'Cape Cod National Seashore',
    'caco_information@nps.gov',
    'active',
    '{"priority": "medium", "type": "Coastal Restoration"}',
    admin_user_id
  ),
  -- Mount Greylock State Reservation
  (
    'Mount Greylock State Reservation',
    'High-elevation ecosystem restoration on Massachusetts'' highest peak.',
    default_category_id,
    'cleanup',
    '2025-07-27 08:30:00+00',
    '8:30 AM',
    '4:30 PM',
    'Mount Greylock State Reservation, Adams, MA',
    '30 Rockwell Rd, Lanesborough, MA 01237',
    70,
    ARRAY['Mountain hiking required', 'Weather can change quickly', 'Physical fitness needed'],
    ARRAY['Hiking boots', 'Warm layers', 'Rain gear', 'High-energy snacks'],
    'Mount Greylock State Reservation',
    'greylock@mass.gov',
    'active',
    '{"priority": "medium", "type": "Mountain Ecosystem Restoration"}',
    admin_user_id
  );

  -- Now add tree planting events
  INSERT INTO events (
    title, description, category_id, event_type, event_date, start_time, end_time,
    location, address, max_participants, requirements, what_to_bring,
    organizer_name, organizer_contact, status, metadata, created_by
  ) VALUES
  -- Get tree planting category
  (
    'Emerald Necklace Tree Initiative',
    'Community tree planting event along Boston''s historic park system.',
    (SELECT id FROM event_categories WHERE name = 'Tree Planting' LIMIT 1),
    'treePlanting',
    '2025-07-20 10:00:00+00',
    '10:00 AM',
    '2:00 PM',
    'Franklin Park, Boston, MA',
    '1 Franklin Park Rd, Boston, MA 02121',
    80,
    ARRAY['Physical activity involved', 'Digging and planting', 'Weather dependent'],
    ARRAY['Work gloves', 'Sturdy shoes', 'Water bottle', 'Snacks'],
    'Boston Parks and Recreation',
    'trees@boston.gov',
    'active',
    '{"trees": 250, "type": "Urban Reforestation", "priority": "medium"}',
    admin_user_id
  ),
  (
    'Cambridge Urban Forest Expansion',
    'Street tree planting program in Cambridge neighborhoods.',
    (SELECT id FROM event_categories WHERE name = 'Tree Planting' LIMIT 1),
    'treePlanting',
    '2025-08-01 09:00:00+00',
    '9:00 AM',
    '1:00 PM',
    'Cambridge Common, Cambridge, MA',
    'Cambridge Common, Cambridge, MA 02138',
    60,
    ARRAY['Urban tree planting', 'Sidewalk work', 'City coordination required'],
    ARRAY['Work gloves', 'Comfortable shoes', 'Water', 'Sun protection'],
    'Cambridge Department of Public Works',
    'forestry@cambridgema.gov',
    'active',
    '{"trees": 175, "type": "Street Tree Planting", "priority": "low"}',
    admin_user_id
  ),
  (
    'Forest River Park Tree Planting',
    'Native tree planting initiative to restore urban forest canopy in Salem''s largest park.',
    (SELECT id FROM event_categories WHERE name = 'Tree Planting' LIMIT 1),
    'treePlanting',
    '2025-08-10 09:30:00+00',
    '9:30 AM',
    '2:30 PM',
    'Forest River Park, Salem, MA',
    'Forest River Park, Salem, MA 01970',
    90,
    ARRAY['Native species planting', 'Park restoration', 'Community involvement'],
    ARRAY['Work gloves', 'Digging tools provided', 'Water bottle', 'Lunch'],
    'Salem Parks Department',
    'parks@salem.com',
    'active',
    '{"trees": 300, "type": "Urban Reforestation", "priority": "medium"}',
    admin_user_id
  );

  -- Add community garden events
  INSERT INTO events (
    title, description, category_id, event_type, event_date, start_time, end_time,
    location, address, max_participants, requirements, what_to_bring,
    organizer_name, organizer_contact, status, metadata, created_by
  ) VALUES
  (
    'Capron Park Community Garden',
    'Community garden expansion project promoting sustainable urban agriculture and education.',
    (SELECT id FROM event_categories WHERE name = 'Community Garden' LIMIT 1),
    'garden',
    '2025-07-30 10:00:00+00',
    '10:00 AM',
    '4:00 PM',
    'Capron Park Zoo, Attleboro, MA',
    '201 County St, Attleboro, MA 02703',
    40,
    ARRAY['Gardening experience helpful', 'Physical work involved', 'All skill levels welcome'],
    ARRAY['Gardening gloves', 'Small hand tools', 'Water bottle', 'Lunch'],
    'Attleboro Community Gardens',
    'gardens@attleboro.org',
    'active',
    '{"plots": 85, "type": "Community Garden"}',
    admin_user_id
  ),
  (
    'Fenway Victory Gardens',
    'Historic community gardens with over 500 plots for local residents.',
    (SELECT id FROM event_categories WHERE name = 'Community Garden' LIMIT 1),
    'garden',
    '2025-07-01 10:00:00+00',
    '10:00 AM',
    '4:00 PM',
    'Fenway Victory Gardens, Boston, MA',
    'Park Dr & Boylston St, Boston, MA 02215',
    200,
    ARRAY['Historic garden maintenance', 'Plot assignment available', 'Seasonal planning'],
    ARRAY['Gardening tools', 'Seeds or plants', 'Water container', 'Notebook'],
    'Fenway Victory Gardens',
    'info@fenwayvictorygardens.org',
    'active',
    '{"plots": 500, "type": "Community Garden"}',
    admin_user_id
  ),
  (
    'Cambridge Community Garden',
    'Urban garden promoting sustainable food production and community engagement.',
    (SELECT id FROM event_categories WHERE name = 'Community Garden' LIMIT 1),
    'garden',
    '2025-08-01 09:00:00+00',
    '9:00 AM',
    '3:00 PM',
    'Cambridge Community Gardens, Cambridge, MA',
    '99 Bishop Allen Dr, Cambridge, MA 02139',
    75,
    ARRAY['Sustainable practices focus', 'Organic methods only', 'Community sharing'],
    ARRAY['Organic seeds', 'Hand tools', 'Compost materials', 'Water bottle'],
    'Cambridge Community Gardens',
    'grow@cambridgegardens.org',
    'active',
    '{"plots": 150, "type": "Community Garden"}',
    admin_user_id
  ),
  (
    'Somerville Growing Center',
    'Educational garden space focusing on sustainable urban agriculture.',
    (SELECT id FROM event_categories WHERE name = 'Community Garden' LIMIT 1),
    'garden',
    '2025-07-15 11:00:00+00',
    '11:00 AM',
    '5:00 PM',
    'Somerville Community Growing Center, Somerville, MA',
    '22 Vinal Ave, Somerville, MA 02143',
    50,
    ARRAY['Educational focus', 'Sustainable techniques', 'Youth programs available'],
    ARRAY['Notebook for learning', 'Gardening gloves', 'Water bottle', 'Enthusiasm'],
    'Somerville Growing Center',
    'learn@somervillegrows.org',
    'active',
    '{"plots": 75, "type": "Community Garden"}',
    admin_user_id
  );

  RAISE NOTICE 'Successfully populated events table with % events from map data', 
    (SELECT COUNT(*) FROM events WHERE created_by = admin_user_id);

END $$;

-- Create function for admin user management
CREATE OR REPLACE FUNCTION manage_admin_users(
  target_email text,
  action text, -- 'add' or 'remove'
  current_admin_id uuid DEFAULT auth.uid()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  result json;
BEGIN
  -- Verify current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = current_admin_id AND role = 'admin'
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Access denied: Admin privileges required');
  END IF;

  -- Find target user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not found with email: ' || target_email);
  END IF;

  -- Perform the requested action
  IF action = 'add' THEN
    -- Add admin role
    INSERT INTO user_roles (user_id, role, assigned_by)
    VALUES (target_user_id, 'admin', current_admin_id)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    result := json_build_object(
      'success', true, 
      'message', 'Admin role added to ' || target_email,
      'user_id', target_user_id,
      'action', 'added'
    );
    
  ELSIF action = 'remove' THEN
    -- Prevent removing the last admin
    IF (SELECT COUNT(*) FROM user_roles WHERE role = 'admin') <= 1 THEN
      RETURN json_build_object('success', false, 'message', 'Cannot remove the last admin user');
    END IF;
    
    -- Remove admin role
    DELETE FROM user_roles 
    WHERE user_id = target_user_id AND role = 'admin';
    
    result := json_build_object(
      'success', true, 
      'message', 'Admin role removed from ' || target_email,
      'user_id', target_user_id,
      'action', 'removed'
    );
    
  ELSE
    RETURN json_build_object('success', false, 'message', 'Invalid action. Use "add" or "remove"');
  END IF;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION manage_admin_users TO authenticated;

-- Create function to list all admin users
CREATE OR REPLACE FUNCTION list_admin_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  assigned_at timestamptz,
  assigned_by_email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ur.user_id,
    u.email,
    ur.assigned_at,
    ab.email as assigned_by_email
  FROM user_roles ur
  JOIN auth.users u ON ur.user_id = u.id
  LEFT JOIN auth.users ab ON ur.assigned_by = ab.id
  WHERE ur.role = 'admin'
  ORDER BY ur.assigned_at ASC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION list_admin_users TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION manage_admin_users IS 'Allows admin users to add or remove admin privileges from other users';
COMMENT ON FUNCTION list_admin_users IS 'Returns a list of all admin users with assignment details';