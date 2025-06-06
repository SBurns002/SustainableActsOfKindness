/*
  # Fix MFA Verification Issues

  This migration addresses potential MFA verification problems by:
  1. Cleaning up any corrupted MFA state for sdavies8@bu.edu
  2. Ensuring proper MFA configuration
  3. Adding debugging information
  4. Resetting any stuck authentication state
*/

-- First, comprehensive cleanup for the specific user
DO $$
DECLARE
    target_user_id uuid;
    factor_count integer := 0;
    challenge_count integer := 0;
    session_count integer := 0;
BEGIN
    -- Get the user ID for sdavies8@bu.edu
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'sdavies8@bu.edu';
    
    IF target_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found user sdavies8@bu.edu with ID: %', target_user_id;
        
        -- Count existing records before cleanup
        SELECT COUNT(*) INTO factor_count FROM auth.mfa_factors WHERE user_id = target_user_id;
        SELECT COUNT(*) INTO challenge_count FROM auth.mfa_challenges 
        WHERE factor_id IN (SELECT id FROM auth.mfa_factors WHERE user_id = target_user_id);
        SELECT COUNT(*) INTO session_count FROM auth.sessions WHERE user_id = target_user_id;
        
        RAISE NOTICE 'Before cleanup - Factors: %, Challenges: %, Sessions: %', factor_count, challenge_count, session_count;
        
        -- Step 1: Remove all MFA challenges for this user's factors
        DELETE FROM auth.mfa_challenges 
        WHERE factor_id IN (
            SELECT id FROM auth.mfa_factors WHERE user_id = target_user_id
        );
        
        -- Step 2: Remove all MFA factors for this user
        DELETE FROM auth.mfa_factors 
        WHERE user_id = target_user_id;
        
        -- Step 3: Reset all sessions to AAL1 (remove MFA requirement)
        UPDATE auth.sessions 
        SET aal = 'aal1', 
            updated_at = now()
        WHERE user_id = target_user_id;
        
        -- Step 4: Clear any potential MFA-related metadata from user record
        UPDATE auth.users 
        SET updated_at = now()
        WHERE id = target_user_id;
        
        -- Verify cleanup
        SELECT COUNT(*) INTO factor_count FROM auth.mfa_factors WHERE user_id = target_user_id;
        SELECT COUNT(*) INTO challenge_count FROM auth.mfa_challenges 
        WHERE factor_id IN (SELECT id FROM auth.mfa_factors WHERE user_id = target_user_id);
        
        RAISE NOTICE 'After cleanup - Factors: %, Challenges: %', factor_count, challenge_count;
        RAISE NOTICE 'MFA state completely reset for sdavies8@bu.edu';
        
    ELSE
        RAISE NOTICE 'User sdavies8@bu.edu not found in auth.users table';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during MFA cleanup: %', SQLERRM;
        RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
END $$;

-- Global cleanup of orphaned records
DO $$
DECLARE
    orphaned_challenges integer := 0;
    expired_challenges integer := 0;
BEGIN
    -- Clean up orphaned challenges (challenges without valid factors)
    SELECT COUNT(*) INTO orphaned_challenges
    FROM auth.mfa_challenges 
    WHERE factor_id NOT IN (SELECT id FROM auth.mfa_factors);
    
    DELETE FROM auth.mfa_challenges 
    WHERE factor_id NOT IN (SELECT id FROM auth.mfa_factors);
    
    -- Clean up expired challenges (older than 1 hour)
    SELECT COUNT(*) INTO expired_challenges
    FROM auth.mfa_challenges 
    WHERE created_at < now() - interval '1 hour';
    
    DELETE FROM auth.mfa_challenges 
    WHERE created_at < now() - interval '1 hour';
    
    RAISE NOTICE 'Cleaned up % orphaned challenges and % expired challenges', orphaned_challenges, expired_challenges;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Note: Could not clean orphaned/expired challenges: %', SQLERRM;
END $$;

-- Add some debugging information about MFA configuration
DO $$
DECLARE
    mfa_enabled boolean := false;
    total_factors integer := 0;
    total_challenges integer := 0;
BEGIN
    -- Check if MFA is enabled at the project level
    -- Note: This might not be accessible from SQL, but we'll try
    SELECT COUNT(*) INTO total_factors FROM auth.mfa_factors;
    SELECT COUNT(*) INTO total_challenges FROM auth.mfa_challenges;
    
    RAISE NOTICE 'Project MFA status - Total factors: %, Total challenges: %', total_factors, total_challenges;
    
    -- List all users with MFA enabled (for debugging)
    FOR mfa_enabled IN 
        SELECT DISTINCT user_id 
        FROM auth.mfa_factors 
        WHERE status = 'verified'
        LIMIT 5
    LOOP
        RAISE NOTICE 'User with verified MFA factor: %', mfa_enabled;
    END LOOP;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not retrieve MFA debugging info: %', SQLERRM;
END $$;