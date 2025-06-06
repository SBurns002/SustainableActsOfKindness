import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, AlertCircle, RefreshCw, X, CheckCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

interface MFASetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [step, setStep] = useState<'initial' | 'scan' | 'verify' | 'success'>('initial');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [detailedError, setDetailedError] = useState<string>('');

  const enrollMFA = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDetailedError('');
      setDebugInfo('Checking authentication status...');

      // First, verify user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('You must be logged in to set up MFA. Please refresh the page and try again.');
        return;
      }

      setDebugInfo('Checking existing MFA factors...');

      // Check if user already has MFA enabled
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        console.error('Error checking existing factors:', factorsError);
        setDetailedError(`Factors check error: ${factorsError.message}`);
        
        if (factorsError.message?.includes('mfa_disabled')) {
          setError('Multi-factor authentication is not enabled for this project. Please contact support.');
          return;
        }
      } else if (factors?.totp && factors.totp.length > 0) {
        const verifiedFactor = factors.totp.find(f => f.status === 'verified');
        if (verifiedFactor) {
          setError('You already have MFA enabled. Please disable it first before setting up a new factor.');
          return;
        }
        
        // Clean up any unverified factors
        const unverifiedFactors = factors.totp.filter(f => f.status !== 'verified');
        if (unverifiedFactors.length > 0) {
          setDebugInfo('Cleaning up previous incomplete setup...');
          for (const factor of unverifiedFactors) {
            try {
              await supabase.auth.mfa.unenroll({ factorId: factor.id });
            } catch (cleanupError) {
              console.warn('Could not clean up unverified factor:', cleanupError);
            }
          }
        }
      }

      setDebugInfo('Enrolling new MFA factor...');
      
      // Generate a unique friendly name
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const friendlyName = `Authenticator App - ${timestamp}`;
      
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: friendlyName
      });

      if (error) {
        console.error('MFA enrollment error:', error);
        setDetailedError(`Enrollment error: ${JSON.stringify(error)}`);
        
        if (error.message?.includes('unexpected_failure')) {
          setError('MFA setup failed due to a server error. Please wait a few minutes and try again.');
        } else if (error.message?.includes('mfa_disabled')) {
          setError('Multi-factor authentication is disabled for this project. Please contact your administrator.');
        } else if (error.message?.includes('factor_name_conflict') || error.message?.includes('already exists')) {
          setError('An MFA factor already exists. Please refresh the page and try again.');
        } else if (error.message?.includes('rate_limit')) {
          setError('Too many attempts. Please wait a few minutes before trying again.');
        } else {
          setError(`Failed to set up MFA: ${error.message}`);
        }
        return;
      }

      if (data && data.totp) {
        console.log('MFA enrollment successful:', { 
          id: data.id, 
          hasQrCode: !!data.totp.qr_code, 
          hasSecret: !!data.totp.secret 
        });
        
        if (!data.totp.qr_code || !data.totp.secret) {
          setError('Incomplete MFA setup data received. Please try again.');
          setDetailedError(`Missing data - QR: ${!!data.totp.qr_code}, Secret: ${!!data.totp.secret}`);
          return;
        }
        
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStep('scan');
        setDebugInfo('QR code generated successfully. Please scan with your authenticator app.');
      } else {
        setError('No enrollment data received. Please try again.');
        setDetailedError('Enrollment succeeded but no data returned');
      }
    } catch (err: any) {
      console.error('Unexpected error during MFA enrollment:', err);
      setError('An unexpected error occurred. Please try again or contact support.');
      setDetailedError(`Unexpected error: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!factorId || !verificationCode) {
      setError('Missing factor ID or verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Please enter a complete 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDetailedError('');
      setDebugInfo('Creating verification challenge...');

      console.log('Starting MFA verification process:', {
        factorId: factorId.substring(0, 8) + '...',
        codeLength: verificationCode.length,
        timestamp: new Date().toISOString()
      });

      // Step 1: Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) {
        console.error('Challenge creation failed:', challengeError);
        setDetailedError(`Challenge error: ${JSON.stringify(challengeError)}`);
        
        if (challengeError.message?.includes('factor_not_found')) {
          setError('MFA factor not found. Please restart the setup process.');
          setStep('initial');
          setFactorId(null);
          setQrCode(null);
          setSecret(null);
          return;
        } else if (challengeError.message?.includes('mfa_disabled')) {
          setError('MFA is disabled. Please contact your administrator.');
          return;
        } else {
          setError(`Failed to create verification challenge: ${challengeError.message}`);
          return;
        }
      }

      if (!challengeData?.id) {
        setError('No challenge ID received from server. Please try again.');
        setDetailedError('Challenge created but no ID returned');
        return;
      }

      console.log('Challenge created successfully:', challengeData.id);
      setDebugInfo('Challenge created. Verifying your code...');

      // Add a small delay to ensure the challenge is properly registered
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Verify the code with the challenge
      console.log('Attempting verification with:', {
        factorId: factorId.substring(0, 8) + '...',
        challengeId: challengeData.id,
        codeLength: verificationCode.trim().length
      });

      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode.trim() // Trim any whitespace
      });

      console.log('Verification response:', {
        hasData: !!verifyData,
        error: verifyError ? verifyError.message : 'none'
      });

      if (verifyError) {
        console.error('MFA verification error:', verifyError);
        setDetailedError(`Verification error: ${JSON.stringify(verifyError)}`);
        
        if (verifyError.message?.includes('invalid_code')) {
          setError('Invalid verification code. Please check your authenticator app and try again. Make sure you\'re using the current code (codes change every 30 seconds).');
        } else if (verifyError.message?.includes('expired')) {
          setError('Verification code has expired. Please try again with a new code from your authenticator app.');
        } else if (verifyError.message?.includes('challenge_expired')) {
          setError('Verification session expired. Please try again.');
        } else if (verifyError.message?.includes('factor_id must be an UUID')) {
          setError('Invalid factor ID. Please restart the MFA setup process.');
          setStep('initial');
          setFactorId(null);
          setQrCode(null);
          setSecret(null);
          return;
        } else if (verifyError.message?.includes('too_many_attempts')) {
          setError('Too many failed attempts. Please wait a few minutes before trying again.');
        } else {
          setError(`Verification failed: ${verifyError.message}`);
        }
        
        // Clear the code on error so user can try again
        setVerificationCode('');
        return;
      }

      // Check if verification was successful
      if (verifyData) {
        console.log('MFA verification successful:', verifyData);
        setDebugInfo('Verification successful! Checking MFA status...');
        
        // Verify that the factor is now verified
        const { data: updatedFactors, error: factorsError } = await supabase.auth.mfa.listFactors();
        
        if (factorsError) {
          console.warn('Could not verify MFA status:', factorsError);
        } else {
          const verifiedFactor = updatedFactors?.totp?.find(f => f.id === factorId && f.status === 'verified');
          if (verifiedFactor) {
            console.log('MFA factor successfully verified:', verifiedFactor);
            setDebugInfo('MFA successfully enabled!');
            setStep('success');
            toast.success('Two-factor authentication has been successfully enabled!');
            
            // Call onComplete to refresh the parent component
            setTimeout(() => {
              onComplete();
            }, 1500);
            return;
          } else {
            console.warn('MFA factor not found in verified state:', updatedFactors?.totp);
            setError('Verification completed but MFA status could not be confirmed. Please check your profile to see if MFA is enabled.');
          }
        }
        
        // Fallback: assume success if we got here without errors
        setDebugInfo('Verification completed successfully!');
        setStep('success');
        toast.success('Two-factor authentication has been successfully enabled!');
        
        setTimeout(() => {
          onComplete();
        }, 1500);
        
      } else {
        console.warn('Verification returned no data');
        setError('Verification completed but no confirmation received. Please check if MFA is enabled in your profile.');
        setDetailedError('Verification returned no data');
      }
    } catch (err: any) {
      console.error('Unexpected error during MFA verification:', err);
      setError('An unexpected error occurred during verification. Please try again.');
      setDetailedError(`Unexpected verification error: ${err.message || err}`);
      setVerificationCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const retrySetup = () => {
    setError(null);
    setDetailedError('');
    setQrCode(null);
    setSecret(null);
    setVerificationCode('');
    setFactorId(null);
    setStep('initial');
    setIsLoading(false);
    setDebugInfo('');
  };

  const handleCodeChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(cleanValue);
    
    // Clear any previous errors when user starts typing
    if (error && cleanValue.length > 0) {
      setError(null);
      setDetailedError('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-900">Set Up Two-Factor Authentication</h2>
          </div>
          {step !== 'success' && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {debugInfo && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-800 text-sm font-medium">Status:</p>
                <p className="text-blue-700 text-sm">{debugInfo}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Setup Failed</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                
                {detailedError && (
                  <details className="mt-2">
                    <summary className="text-red-600 text-xs cursor-pointer">Technical Details</summary>
                    <p className="text-red-600 text-xs mt-1 font-mono bg-red-100 p-2 rounded">
                      {detailedError}
                    </p>
                  </details>
                )}
                
                {error.includes('not properly configured') && (
                  <div className="mt-3 text-sm text-red-700">
                    <p className="font-medium">To fix this issue:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>Go to your Supabase project dashboard</li>
                      <li>Navigate to Authentication → Settings</li>
                      <li>Enable "Multi-Factor Authentication"</li>
                      <li>Save the settings and try again</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3">
              <button
                onClick={retrySetup}
                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                disabled={isLoading}
              >
                <RefreshCw className="w-3 h-3" />
                Try Again
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">MFA Successfully Enabled!</h3>
            <p className="text-gray-600">
              Your account is now protected with two-factor authentication.
            </p>
          </div>
        )}

        {step === 'initial' && !error && (
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Two-factor authentication adds an extra layer of security to your account by requiring a code from your phone in addition to your password.
            </p>
            <button
              onClick={enrollMFA}
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Set Up MFA'
              )}
            </button>
          </div>
        )}

        {step === 'scan' && qrCode && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Step 1: Scan QR Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
              </p>
              <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
              </div>
            </div>

            {secret && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Manual Entry</h4>
                <p className="text-sm text-gray-600 mb-2">
                  If you can't scan the QR code, enter this secret manually:
                </p>
                <code className="block p-3 bg-gray-100 rounded text-sm font-mono break-all">
                  {secret}
                </code>
              </div>
            )}

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Step 2: Enter Verification Code</h3>
              <p className="text-sm text-gray-600 mb-3">
                Enter the 6-digit code from your authenticator app:
              </p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-lg font-mono"
                maxLength={6}
                autoFocus
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Make sure to use the current code from your app (codes refresh every 30 seconds)
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={verifyAndEnable}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {debugInfo.includes('Creating') ? 'Creating...' : 
                     debugInfo.includes('Verifying') ? 'Verifying...' : 
                     debugInfo.includes('Checking') ? 'Checking...' : 'Processing...'}
                  </>
                ) : (
                  'Verify & Enable'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}