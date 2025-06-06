/*
  # MFA Cleanup Migration

  This migration safely cleans up MFA-related data for users experiencing issues
  with multi-factor authentication setup and verification.

  ## What this migration does:
  1. Creates a temporary function to clean up MFA data for specific users
  2. Executes cleanup for the target user (sdavies8@bu.edu)
  3. Performs global cleanup of orphaned and expired MFA data
  4. Provides system status information
  5. Removes the temporary function

  ## Safety measures:
  - Uses proper error handling with try-catch blocks
  - Provides detailed logging of all operations
  - Only removes data that is safe to remove (orphaned, expired, or problematic)
*/

-- Function to safely clean up MFA data with detailed logging
CREATE OR REPLACE FUNCTION cleanup_user_mfa(user_email text)
RETURNS TABLE(
  action text,
  details text,
  success boolean
) AS $$
DECLARE
  target_user_id uuid;
  factor_count integer := 0;
  challenge_count integer := 0;
  session_count integer := 0;
BEGIN
  -- Find the user
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN QUERY SELECT 'user_lookup'::text, ('User not found: ' || user_email)::text, false;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 'user_found'::text, ('User ID: ' || target_user_id::text)::text, true;
  
  -- Count existing data
  SELECT COUNT(*) INTO factor_count FROM auth.mfa_factors WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO challenge_count FROM auth.mfa_challenges 
  WHERE factor_id IN (SELECT id FROM auth.mfa_factors WHERE user_id = target_user_id);
  SELECT COUNT(*) INTO session_count FROM auth.sessions WHERE user_id = target_user_id;
  
  RETURN QUERY SELECT 'initial_count'::text, 
    format('Factors: %s, Challenges: %s, Sessions: %s', factor_count, challenge_count, session_count)::text, 
    true;
  
  -- Step 1: Remove MFA challenges
  BEGIN
    DELETE FROM auth.mfa_challenges 
    WHERE factor_id IN (SELECT id FROM auth.mfa_factors WHERE user_id = target_user_id);
    
    GET DIAGNOSTICS challenge_count = ROW_COUNT;
    RETURN QUERY SELECT 'challenges_removed'::text, ('Removed ' || challenge_count || ' challenges')::text, true;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'challenges_error'::text, ('Error: ' || SQLERRM)::text, false;
  END;
  
  -- Step 2: Remove MFA factors
  BEGIN
    DELETE FROM auth.mfa_factors WHERE user_id = target_user_id;
    
    GET DIAGNOSTICS factor_count = ROW_COUNT;
    RETURN QUERY SELECT 'factors_removed'::text, ('Removed ' || factor_count || ' factors')::text, true;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'factors_error'::text, ('Error: ' || SQLERRM)::text, false;
  END;
  
  -- Step 3: Reset session AAL
  BEGIN
    UPDATE auth.sessions 
    SET aal = 'aal1', updated_at = now()
    WHERE user_id = target_user_id AND aal != 'aal1';
    
    GET DIAGNOSTICS session_count = ROW_COUNT;
    RETURN QUERY SELECT 'sessions_reset'::text, ('Reset ' || session_count || ' sessions to aal1')::text, true;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'sessions_error'::text, ('Error: ' || SQLERRM)::text, false;
  END;
  
  -- Step 4: Update user record timestamp
  BEGIN
    UPDATE auth.users 
    SET updated_at = now()
    WHERE id = target_user_id;
    
    RETURN QUERY SELECT 'user_updated'::text, 'User record timestamp updated'::text, true;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 'user_update_error'::text, ('Error: ' || SQLERRM)::text, false;
  END;
  
  -- Final verification
  SELECT COUNT(*) INTO factor_count FROM auth.mfa_factors WHERE user_id = target_user_id;
  SELECT COUNT(*) INTO challenge_count FROM auth.mfa_challenges 
  WHERE factor_id IN (SELECT id FROM auth.mfa_factors WHERE user_id = target_user_id);
  
  RETURN QUERY SELECT 'final_verification'::text, 
    format('Remaining - Factors: %s, Challenges: %s', factor_count, challenge_count)::text, 
    (factor_count = 0 AND challenge_count = 0);
    
END;
$$ LANGUAGE plpgsql;

-- Execute cleanup for the specific user
DO $$
DECLARE
  cleanup_result record;
BEGIN
  RAISE NOTICE '=== Starting MFA Cleanup for sdavies8@bu.edu ===';
  
  FOR cleanup_result IN 
    SELECT * FROM cleanup_user_mfa('sdavies8@bu.edu')
  LOOP
    IF cleanup_result.success THEN
      RAISE NOTICE '[SUCCESS] %: %', cleanup_result.action, cleanup_result.details;
    ELSE
      RAISE WARNING '[ERROR] %: %', cleanup_result.action, cleanup_result.details;
    END IF;
  END LOOP;
  
  RAISE NOTICE '=== MFA Cleanup Complete ===';
END $$;

-- Global cleanup of orphaned and expired data
DO $$
DECLARE
  orphaned_challenges integer := 0;
  expired_challenges integer := 0;
  old_factors integer := 0;
BEGIN
  RAISE NOTICE '=== Starting Global MFA Cleanup ===';
  
  -- Remove orphaned challenges (challenges without valid factors)
  BEGIN
    SELECT COUNT(*) INTO orphaned_challenges
    FROM auth.mfa_challenges 
    WHERE factor_id NOT IN (SELECT id FROM auth.mfa_factors);
    
    DELETE FROM auth.mfa_challenges 
    WHERE factor_id NOT IN (SELECT id FROM auth.mfa_factors);
    
    RAISE NOTICE 'Removed % orphaned challenges', orphaned_challenges;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Could not clean orphaned challenges: %', SQLERRM;
  END;
  
  -- Remove expired challenges (older than 2 hours)
  BEGIN
    SELECT COUNT(*) INTO expired_challenges
    FROM auth.mfa_challenges 
    WHERE created_at < now() - interval '2 hours';
    
    DELETE FROM auth.mfa_challenges 
    WHERE created_at < now() - interval '2 hours';
    
    RAISE NOTICE 'Removed % expired challenges', expired_challenges;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Could not clean expired challenges: %', SQLERRM;
  END;
  
  -- Remove very old unverified factors (older than 1 day)
  BEGIN
    SELECT COUNT(*) INTO old_factors
    FROM auth.mfa_factors 
    WHERE status != 'verified' AND created_at < now() - interval '1 day';
    
    DELETE FROM auth.mfa_factors 
    WHERE status != 'verified' AND created_at < now() - interval '1 day';
    
    RAISE NOTICE 'Removed % old unverified factors', old_factors;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Could not clean old factors: %', SQLERRM;
  END;
  
  RAISE NOTICE '=== Global MFA Cleanup Complete ===';
END $$;

-- Provide system status information
DO $$
DECLARE
  total_users integer;
  users_with_mfa integer;
  total_factors integer;
  verified_factors integer;
  total_challenges integer;
  recent_challenges integer;
BEGIN
  RAISE NOTICE '=== MFA System Status ===';
  
  -- Count users and MFA adoption
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(DISTINCT user_id) INTO users_with_mfa FROM auth.mfa_factors WHERE status = 'verified';
  
  -- Count factors
  SELECT COUNT(*) INTO total_factors FROM auth.mfa_factors;
  SELECT COUNT(*) INTO verified_factors FROM auth.mfa_factors WHERE status = 'verified';
  
  -- Count challenges
  SELECT COUNT(*) INTO total_challenges FROM auth.mfa_challenges;
  SELECT COUNT(*) INTO recent_challenges FROM auth.mfa_challenges WHERE created_at > now() - interval '1 hour';
  
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Users with verified MFA: %', users_with_mfa;
  RAISE NOTICE 'Total MFA factors: % (% verified)', total_factors, verified_factors;
  RAISE NOTICE 'Total challenges: % (% in last hour)', total_challenges, recent_challenges;
  
  -- Check if MFA appears to be working
  IF total_factors > 0 AND verified_factors > 0 THEN
    RAISE NOTICE 'MFA system appears to be functional';
  ELSE
    RAISE NOTICE 'MFA system may need configuration check';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not retrieve system status: %', SQLERRM;
END $$;

-- Clean up the temporary function
DROP FUNCTION IF EXISTS cleanup_user_mfa(text);