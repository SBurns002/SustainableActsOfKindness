/*
  # Assign Admin Role to Current User
  
  This migration assigns admin role to the first user who signs up.
  In production, you would manually assign admin roles through a secure process.
*/

-- Function to assign admin role to the first user
CREATE OR REPLACE FUNCTION assign_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if this is the first user and no admin exists yet
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin') THEN
    INSERT INTO user_roles (user_id, role, assigned_by)
    VALUES (NEW.id, 'admin', NEW.id);
  ELSE
    -- Assign regular user role to subsequent users
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically assign roles on user creation
DROP TRIGGER IF EXISTS assign_user_role_trigger ON auth.users;
CREATE TRIGGER assign_user_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_first_admin();

-- For existing users, assign roles if they don't have any
DO $$
DECLARE
  user_record RECORD;
  admin_exists BOOLEAN;
BEGIN
  -- Check if any admin exists
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin') INTO admin_exists;
  
  -- Assign roles to existing users who don't have any
  FOR user_record IN 
    SELECT id FROM auth.users 
    WHERE id NOT IN (SELECT user_id FROM user_roles)
    ORDER BY created_at ASC
  LOOP
    IF NOT admin_exists THEN
      -- Make the first user an admin
      INSERT INTO user_roles (user_id, role, assigned_by)
      VALUES (user_record.id, 'admin', user_record.id);
      admin_exists := TRUE;
      RAISE NOTICE 'Assigned admin role to user: %', user_record.id;
    ELSE
      -- Make subsequent users regular users
      INSERT INTO user_roles (user_id, role)
      VALUES (user_record.id, 'user');
      RAISE NOTICE 'Assigned user role to user: %', user_record.id;
    END IF;
  END LOOP;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION assign_first_admin() IS 'Automatically assigns admin role to first user, user role to others';
COMMENT ON TABLE user_roles IS 'Stores user role assignments with admin and user roles';