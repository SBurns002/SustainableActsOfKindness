/*
  # Remove MFA for specific user

  1. Purpose
    - Remove all MFA factors for user sdavies8@bu.edu
    - Clean up any associated authentication data
    - Allow fresh MFA setup attempt

  2. Safety
    - Only affects the specific user email
    - Does not impact other users' MFA settings
    - Reversible by re-enabling MFA through the UI
*/

-- First, let's find the user ID for sdavies8@bu.edu
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Get the user ID for sdavies8@bu.edu
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'sdavies8@bu.edu';
    
    IF target_user_id IS NOT NULL THEN
        -- Remove MFA factors for this user
        DELETE FROM auth.mfa_factors 
        WHERE user_id = target_user_id;
        
        -- Remove any MFA challenges for this user
        DELETE FROM auth.mfa_challenges 
        WHERE factor_id IN (
            SELECT id FROM auth.mfa_factors WHERE user_id = target_user_id
        );
        
        -- Log the action
        RAISE NOTICE 'Removed MFA factors for user: sdavies8@bu.edu (ID: %)', target_user_id;
    ELSE
        RAISE NOTICE 'User sdavies8@bu.edu not found';
    END IF;
END $$;