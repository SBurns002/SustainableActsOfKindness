import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, AlertCircle, RefreshCw, AlertTriangle, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface MFADisableProps {
  onSuccess: () => void;
  onCancel: () => void;
  totpFactorId: string;
}

export default function MFADisable({ onSuccess, onCancel, totpFactorId }: MFADisableProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'verify' | 'success'>('verify');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const createChallenge = async () => {
    try {
      setDebugInfo('Creating MFA challenge...');
      console.log('Creating challenge for factor:', totpFactorId);

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactorId
      });

      if (challengeError) {
        console.error('Challenge creation failed:', challengeError);
        throw new Error(`Challenge failed: ${challengeError.message}`);
      }

      if (!challengeData?.id) {
        throw new Error('No challenge ID received');
      }

      console.log('Challenge created successfully:', challengeData.id);
      setChallengeId(challengeData.id);
      setDebugInfo('Challenge created. Please enter your verification code.');
      return challengeData.id;
    } catch (err: any) {
      console.error('Challenge creation error:', err);
      throw err;
    }
  };

  const disableMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    if (!challengeId) {
      setError('No challenge available. Please try again.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo('Verifying code...');

      console.log('Starting verification with:', {
        factorId: totpFactorId,
        challengeId: challengeId,
        codeLength: verificationCode.length
      });

      // Add timeout to prevent hanging - increased to 60 seconds
      const verificationPromise = supabase.auth.mfa.verify({
        factorId: totpFactorId,
        challengeId: challengeId,
        code: verificationCode
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Verification timed out after 60 seconds')), 60000);
      });

      const { data: verifyData, error: verifyError } = await Promise.race([
        verificationPromise,
        timeoutPromise
      ]) as any;

      if (verifyError) {
        console.error('Verification failed:', verifyError);
        
        // Reset challenge on verification failure
        setChallengeId(null);
        
        if (verifyError.message?.includes('invalid_code')) {
          throw new Error('Invalid verification code. Please check your authenticator app and try again.');
        } else if (verifyError.message?.includes('expired')) {
          throw new Error('Verification code has expired. Please try again with a new code.');
        } else if (verifyError.message?.includes('challenge_expired')) {
          throw new Error('Challenge expired. Please try again.');
        } else {
          throw new Error(`Verification failed: ${verifyError.message}`);
        }
      }

      console.log('Code verified successfully:', verifyData);
      setDebugInfo('Code verified. Disabling MFA...');

      // Step 3: Unenroll the factor with timeout - increased to 60 seconds
      console.log('Attempting to unenroll factor:', totpFactorId);

      const unenrollPromise = supabase.auth.mfa.unenroll({
        factorId: totpFactorId
      });

      const unenrollTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Unenroll timed out after 60 seconds')), 60000);
      });

      const { error: unenrollError } = await Promise.race([
        unenrollPromise,
        unenrollTimeoutPromise
      ]) as any;

      if (unenrollError) {
        console.error('Unenroll failed:', unenrollError);
        throw new Error(`Failed to disable MFA: ${unenrollError.message}`);
      }

      console.log('MFA disabled successfully');
      setDebugInfo('MFA disabled successfully!');
      setStep('success');
      toast.success('Two-factor authentication has been successfully disabled.');
      
      // Call onSuccess after a brief delay
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error('MFA disable error:', err);
      
      if (err.message?.includes('timed out')) {
        setError('The operation timed out. This might be a temporary issue. Please try again.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
      
      setVerificationCode('');
      setDebugInfo('');
      setChallengeId(null); // Reset challenge on error
    } finally {
      setIsLoading(false);
    }
  };

  // Alternative method using challengeAndVerify
  const alternativeDisable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo('Using alternative verification method...');

      console.log('Attempting challengeAndVerify for factor:', totpFactorId);

      // Use challengeAndVerify which combines challenge creation and verification - increased to 60 seconds
      const challengeAndVerifyPromise = supabase.auth.mfa.challengeAndVerify({
        factorId: totpFactorId,
        code: verificationCode
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Alternative method timed out after 60 seconds')), 60000);
      });

      const { data, error } = await Promise.race([
        challengeAndVerifyPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('ChallengeAndVerify failed:', error);
        
        if (error.message?.includes('invalid_code')) {
          throw new Error('Invalid verification code. Please check your authenticator app and try again.');
        } else if (error.message?.includes('expired')) {
          throw new Error('Verification code has expired. Please try again with a new code.');
        } else {
          throw new Error(`Alternative verification failed: ${error.message}`);
        }
      }

      console.log('Alternative verification successful:', data);
      setDebugInfo('Verification successful. Disabling MFA...');

      // Now unenroll the factor - increased to 60 seconds
      const unenrollPromise = supabase.auth.mfa.unenroll({
        factorId: totpFactorId
      });

      const unenrollTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Unenroll timed out after 60 seconds')), 60000);
      });

      const { error: unenrollError } = await Promise.race([
        unenrollPromise,
        unenrollTimeoutPromise
      ]) as any;

      if (unenrollError) {
        console.error('Unenroll failed:', unenrollError);
        throw new Error(`Failed to disable MFA: ${unenrollError.message}`);
      }

      console.log('MFA disabled successfully via alternative method');
      setStep('success');
      toast.success('Two-factor authentication has been successfully disabled.');
      
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error('Alternative disable error:', err);
      
      if (err.message?.includes('timed out')) {
        setError('The alternative method also timed out. Please try the direct disable option.');
      } else {
        setError(err.message || 'Alternative method failed. Please try the direct disable option.');
      }
      
      setVerificationCode('');
      setDebugInfo('');
    } finally {
      setIsLoading(false);
    }
  };

  // Create challenge when component mounts or when retrying
  React.useEffect(() => {
    if (step === 'verify' && !challengeId && !isLoading) {
      createChallenge().catch((err) => {
        console.error('Initial challenge creation failed:', err);
        setError(`Failed to initialize: ${err.message}`);
      });
    }
  }, [step, challengeId, isLoading, totpFactorId]);

  // Simple direct disable without challenge (fallback method)
  const directDisable = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo('Attempting direct disable...');

      console.log('Attempting direct unenroll for factor:', totpFactorId);

      const directPromise = supabase.auth.mfa.unenroll({
        factorId: totpFactorId
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Direct disable timed out after 60 seconds')), 60000);
      });

      const { error } = await Promise.race([
        directPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('Direct disable failed:', error);
        throw new Error(`Direct disable failed: ${error.message}`);
      }

      console.log('Direct disable successful');
      setStep('success');
      toast.success('Two-factor authentication has been successfully disabled.');
      
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error('Direct disable error:', err);
      
      if (err.message?.includes('timed out')) {
        setError('Direct disable also timed out. There may be a connectivity issue.');
      } else {
        setError(err.message || 'Direct disable failed. Please contact support.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const retryProcess = () => {
    setError(null);
    setDebugInfo('');
    setVerificationCode('');
    setChallengeId(null);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-gray-900">Disable Two-Factor Authentication</h2>
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

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">MFA Successfully Disabled</h3>
            <p className="text-gray-600">
              Two-factor authentication has been removed from your account.
            </p>
          </div>
        )}

        {step === 'verify' && (
          <>
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 font-medium">Security Warning</p>
                  <p className="text-amber-700 text-sm mt-1">
                    Disabling two-factor authentication will make your account less secure.
                  </p>
                </div>
              </div>
            </div>

            {debugInfo && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm font-medium">Status:</p>
                <p className="text-blue-700 text-sm">{debugInfo}</p>
                {challengeId && (
                  <p className="text-blue-600 text-xs mt-1">Challenge ID: {challengeId.substring(0, 8)}...</p>
                )}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-medium">Error</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={retryProcess}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                    disabled={isLoading}
                  >
                    <RefreshCw className="w-3 h-3 inline mr-1" />
                    Retry
                  </button>
                  <button
                    onClick={alternativeDisable}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    disabled={isLoading}
                  >
                    Try Alternative Method
                  </button>
                  <button
                    onClick={directDisable}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    disabled={isLoading}
                  >
                    Try Direct Disable
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <p className="text-gray-600 mb-4">
                  Enter the 6-digit verification code from your authenticator app to disable MFA.
                </p>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-lg font-mono"
                  maxLength={6}
                  autoFocus
                  disabled={isLoading}
                />
                {challengeId && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Challenge ready - enter your current TOTP code
                  </p>
                )}
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
                  onClick={disableMFA}
                  disabled={isLoading || verificationCode.length !== 6 || !challengeId}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {debugInfo.includes('Verifying') ? 'Verifying...' : 
                       debugInfo.includes('Disabling') ? 'Disabling...' : 'Processing...'}
                    </>
                  ) : (
                    'Disable MFA'
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}