/*
  # Fix User Signup Database Error

  1. Problem
    - The assign_first_admin() trigger is causing database errors during user signup
    - This prevents new users from being created successfully

  2. Solution
    - Drop the problematic trigger temporarily
    - Create a safer version that handles edge cases
    - Ensure the function doesn't fail if there are any issues

  3. Safety
    - Uses exception handling to prevent signup failures
    - Logs errors without blocking user creation
    - Maintains existing admin assignments
*/

-- Drop the existing trigger that's causing issues
DROP TRIGGER IF EXISTS assign_user_role_trigger ON auth.users;

-- Create a safer version of the assign_first_admin function
CREATE OR REPLACE FUNCTION assign_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_exists BOOLEAN := false;
BEGIN
  -- Use exception handling to prevent signup failures
  BEGIN
    -- Check if any admin exists
    SELECT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin') INTO admin_exists;
    
    -- If no admin exists, make this user an admin
    IF NOT admin_exists THEN
      INSERT INTO user_roles (user_id, role, assigned_by)
      VALUES (NEW.id, 'admin', NEW.id)
      ON CONFLICT (user_id, role) DO NOTHING;
    ELSE
      -- Assign regular user role to subsequent users
      INSERT INTO user_roles (user_id, role)
      VALUES (NEW.id, 'user')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't prevent user creation
      RAISE WARNING 'Failed to assign user role for user %: %', NEW.id, SQLERRM;
      -- Continue with user creation even if role assignment fails
  END;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger with the safer function
CREATE TRIGGER assign_user_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_first_admin();

-- Clean up any potential issues with existing data
DO $$
DECLARE
  user_record RECORD;
  admin_exists BOOLEAN;
BEGIN
  -- Check if any admin exists
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin') INTO admin_exists;
  
  -- Assign roles to existing users who don't have any (safely)
  FOR user_record IN 
    SELECT id FROM auth.users 
    WHERE id NOT IN (SELECT user_id FROM user_roles)
    ORDER BY created_at ASC
  LOOP
    BEGIN
      IF NOT admin_exists THEN
        -- Make the first user an admin
        INSERT INTO user_roles (user_id, role, assigned_by)
        VALUES (user_record.id, 'admin', user_record.id)
        ON CONFLICT (user_id, role) DO NOTHING;
        admin_exists := TRUE;
      ELSE
        -- Make subsequent users regular users
        INSERT INTO user_roles (user_id, role)
        VALUES (user_record.id, 'user')
        ON CONFLICT (user_id, role) DO NOTHING;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log but continue
        RAISE WARNING 'Failed to assign role to existing user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
END $$;

-- Verify the fix
DO $$
DECLARE
  user_count INTEGER;
  role_count INTEGER;
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO role_count FROM user_roles;
  SELECT COUNT(*) INTO admin_count FROM user_roles WHERE role = 'admin';
  
  RAISE NOTICE 'User signup fix applied:';
  RAISE NOTICE '- Total users: %', user_count;
  RAISE NOTICE '- Users with roles: %', role_count;
  RAISE NOTICE '- Admin users: %', admin_count;
  
  IF user_count > role_count THEN
    RAISE NOTICE 'WARNING: % users without roles detected', user_count - role_count;
  END IF;
END $$;