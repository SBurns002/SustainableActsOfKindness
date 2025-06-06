/*
  # Add sdavies8@bu.edu to Admin Group

  1. Changes
    - Find user with email sdavies8@bu.edu
    - Add admin role to this user if they exist
    - Handle case where user doesn't exist yet

  2. Security
    - Uses SECURITY DEFINER function to bypass RLS
    - Only affects the specific email address
*/

-- Function to add admin role to specific user by email
CREATE OR REPLACE FUNCTION add_admin_by_email(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  admin_user_id uuid;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  -- If user doesn't exist, return false
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User with email % not found', user_email;
    RETURN false;
  END IF;

  -- Get the first admin user to use as assigned_by
  SELECT user_id INTO admin_user_id
  FROM user_roles
  WHERE role = 'admin'
  LIMIT 1;

  -- If no admin exists, use the target user as assigned_by
  IF admin_user_id IS NULL THEN
    admin_user_id := target_user_id;
  END IF;

  -- Insert admin role for the user (ignore if already exists)
  INSERT INTO user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, 'admin', admin_user_id)
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Admin role assigned to user: % (email: %)', target_user_id, user_email;
  RETURN true;
END;
$$;

-- Add admin role to sdavies8@bu.edu
SELECT add_admin_by_email('sdavies8@bu.edu');

-- Clean up the function (optional, but keeps the database tidy)
DROP FUNCTION IF EXISTS add_admin_by_email(text);

-- Verify the assignment
DO $$
DECLARE
  user_count integer;
  admin_count integer;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Count admin users
  SELECT COUNT(*) INTO admin_count 
  FROM user_roles 
  WHERE role = 'admin';
  
  RAISE NOTICE 'Total users: %, Admin users: %', user_count, admin_count;
  
  -- Check if sdavies8@bu.edu has admin role
  IF EXISTS (
    SELECT 1 
    FROM auth.users u
    JOIN user_roles ur ON u.id = ur.user_id
    WHERE u.email = 'sdavies8@bu.edu' 
    AND ur.role = 'admin'
  ) THEN
    RAISE NOTICE 'SUCCESS: sdavies8@bu.edu has been granted admin privileges';
  ELSE
    RAISE NOTICE 'INFO: sdavies8@bu.edu either does not exist or admin role assignment failed';
  END IF;
END $$;