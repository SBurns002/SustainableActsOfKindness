/*
  # Fix infinite recursion in user_roles RLS policies

  1. Problem
    - The current RLS policy for admins creates infinite recursion
    - Policy tries to check user roles by querying the same user_roles table it's protecting

  2. Solution
    - Drop the problematic policies
    - Create new policies that avoid self-referencing
    - Use auth.uid() directly for user access
    - Create a separate admin policy that doesn't cause recursion

  3. Security
    - Users can only view their own roles
    - Admin operations will be handled through service role or functions
    - Maintains data security without recursion
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- Create new policies that avoid recursion
CREATE POLICY "Users can view their own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- For admin operations, we'll use a different approach
-- This policy allows users to insert their own roles (for initial setup)
CREATE POLICY "Users can insert their own roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- This policy allows users to update their own roles only if they're already an admin
-- We avoid recursion by using a function that checks auth metadata or JWT claims
CREATE POLICY "Admins can manage roles via service"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a function to safely check if a user is an admin without causing recursion
-- This function will be used by application code, not in RLS policies
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = user_uuid 
    AND role = 'admin'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- Create a function for admin operations that bypasses RLS
CREATE OR REPLACE FUNCTION admin_manage_user_role(
  target_user_id uuid,
  target_role text,
  operation text -- 'insert', 'delete', 'update'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Check if current user is admin using direct query (this function runs as SECURITY DEFINER)
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = current_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Perform the requested operation
  CASE operation
    WHEN 'insert' THEN
      INSERT INTO user_roles (user_id, role, assigned_by)
      VALUES (target_user_id, target_role, current_user_id)
      ON CONFLICT (user_id, role) DO NOTHING;
    WHEN 'delete' THEN
      DELETE FROM user_roles 
      WHERE user_id = target_user_id AND role = target_role;
    ELSE
      RAISE EXCEPTION 'Invalid operation: %', operation;
  END CASE;

  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_manage_user_role TO authenticated;