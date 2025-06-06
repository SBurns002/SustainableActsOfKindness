/*
  # Remove MFA for sdavies8@bu.edu

  1. Clean up MFA factors
    - Remove all MFA factors for the user sdavies8@bu.edu
    - Remove any pending MFA challenges
    - Clean up any orphaned sessions or tokens

  2. Reset MFA state
    - Ensure the user can start fresh with MFA setup
    - Remove any conflicting configurations
*/

-- Remove MFA factors and challenges for sdavies8@bu.edu
DO $$
DECLARE
    target_user_id uuid;
    factor_count integer;
    challenge_count integer;
BEGIN
    -- Get the user ID for sdavies8@bu.edu
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'sdavies8@bu.edu';
    
    IF target_user_id IS NOT NULL THEN
        -- Count existing factors before removal
        SELECT COUNT(*) INTO factor_count
        FROM auth.mfa_factors 
        WHERE user_id = target_user_id;
        
        -- Count existing challenges before removal
        SELECT COUNT(*) INTO challenge_count
        FROM auth.mfa_challenges 
        WHERE factor_id IN (
            SELECT id FROM auth.mfa_factors WHERE user_id = target_user_id
        );
        
        -- Remove any MFA challenges first (foreign key constraint)
        DELETE FROM auth.mfa_challenges 
        WHERE factor_id IN (
            SELECT id FROM auth.mfa_factors WHERE user_id = target_user_id
        );
        
        -- Remove MFA factors for this user
        DELETE FROM auth.mfa_factors 
        WHERE user_id = target_user_id;
        
        -- Also clean up any sessions that might have MFA state
        UPDATE auth.sessions 
        SET aal = 'aal1'
        WHERE user_id = target_user_id AND aal = 'aal2';
        
        -- Log the cleanup results
        RAISE NOTICE 'MFA cleanup completed for user: sdavies8@bu.edu';
        RAISE NOTICE 'User ID: %', target_user_id;
        RAISE NOTICE 'Removed % MFA factors', factor_count;
        RAISE NOTICE 'Removed % MFA challenges', challenge_count;
        RAISE NOTICE 'Reset session AAL to aal1';
        
    ELSE
        RAISE NOTICE 'User sdavies8@bu.edu not found in auth.users table';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during MFA cleanup: %', SQLERRM;
        RAISE NOTICE 'User may not exist or MFA tables may not be accessible';
END $$;

-- Additional cleanup: Remove any potential orphaned records
DO $$
BEGIN
    -- Clean up any orphaned MFA challenges (challenges without valid factors)
    DELETE FROM auth.mfa_challenges 
    WHERE factor_id NOT IN (SELECT id FROM auth.mfa_factors);
    
    RAISE NOTICE 'Cleaned up orphaned MFA challenges';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Note: Could not clean orphaned challenges: %', SQLERRM;
END $$;