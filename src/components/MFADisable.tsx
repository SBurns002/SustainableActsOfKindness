import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, AlertCircle, RefreshCw, AlertTriangle, X, CheckCircle, Info } from 'lucide-react';
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
  const [step, setStep] = useState<'confirm' | 'verify' | 'success'>('confirm');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  // Auto-clear error after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const proceedToVerification = () => {
    setStep('verify');
    setError(null);
    setDebugInfo('Ready to verify. Please enter your current 6-digit code.');
  };

  const disableMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo('Creating verification challenge...');

      console.log('Starting MFA disable process:', {
        factorId: totpFactorId.substring(0, 8) + '...',
        codeLength: verificationCode.length,
        attempt: retryCount + 1
      });

      // Step 1: Create challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactorId
      });

      if (challengeError) {
        console.error('Challenge creation failed:', challengeError);
        
        if (challengeError.message?.includes('factor_not_found')) {
          throw new Error('MFA factor not found. It may have already been disabled.');
        } else if (challengeError.message?.includes('mfa_disabled')) {
          throw new Error('MFA is disabled on this project.');
        } else {
          throw new Error(`Challenge failed: ${challengeError.message}`);
        }
      }

      if (!challengeData?.id) {
        throw new Error('No challenge ID received from server. Please try again.');
      }

      console.log('Challenge created successfully:', challengeData.id);
      setDebugInfo('Challenge created. Verifying your code...');

      // Wait for challenge to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Verify the code
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactorId,
        challengeId: challengeData.id,
        code: verificationCode.trim()
      });

      if (verifyError) {
        console.error('Verification failed:', verifyError);
        
        if (verifyError.message?.includes('invalid_code')) {
          setRetryCount(prev => prev + 1);
          throw new Error('Invalid code. Please check your authenticator app and try again with the current 6-digit code.');
        } else if (verifyError.message?.includes('expired')) {
          throw new Error('Code expired. Please try again with a fresh code from your authenticator app.');
        } else if (verifyError.message?.includes('challenge_expired')) {
          throw new Error('Verification session expired. Please try again.');
        } else if (verifyError.message?.includes('too_many_attempts')) {
          throw new Error('Too many failed attempts. Please wait 5 minutes before trying again.');
        } else {
          throw new Error(`Verification failed: ${verifyError.message}`);
        }
      }

      console.log('Code verified successfully:', verifyData);
      setDebugInfo('Code verified. Disabling MFA...');

      // Step 3: Unenroll the factor
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: totpFactorId
      });

      if (unenrollError) {
        console.error('Unenroll failed:', unenrollError);
        
        if (unenrollError.message?.includes('factor_not_found')) {
          // Factor might already be removed, consider this a success
          console.log('Factor not found during unenroll, assuming already disabled');
        } else {
          throw new Error(`Failed to disable MFA: ${unenrollError.message}`);
        }
      }

      console.log('MFA disabled successfully');
      setDebugInfo('MFA disabled successfully!');
      setStep('success');
      toast.success('Two-factor authentication has been successfully disabled.');
      
      // Call onSuccess after a brief delay
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: any) {
      console.error('MFA disable error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setVerificationCode('');
      setDebugInfo('');
    } finally {
      setIsLoading(false);
    }
  };

  const retryProcess = () => {
    setError(null);
    setDebugInfo('');
    setVerificationCode('');
    setIsLoading(false);
    setRetryCount(0);
  };

  const handleCodeChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(cleanValue);
    
    if (error && cleanValue.length > 0) {
      setError(null);
    }
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
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                
                {retryCount > 2 && (
                  <div className="mt-2 text-sm text-red-700">
                    <p className="font-medium">Having trouble?</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Make sure your device's time is correct</li>
                      <li>Wait 30 seconds for a new code</li>
                      <li>Check you're using the right authenticator app</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3">
              <button
                onClick={retryProcess}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">MFA Successfully Disabled</h3>
            <p className="text-gray-600">
              Two-factor authentication has been removed from your account.
            </p>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 font-medium">Security Warning</p>
                  <p className="text-amber-700 text-sm mt-1">
                    Disabling two-factor authentication will make your account less secure. 
                    You'll only need your password to sign in.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Are you sure you want to disable MFA?</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>This will:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Remove the extra security layer from your account</li>
                  <li>Delete your current authenticator app setup</li>
                  <li>Allow sign-in with just your password</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Keep MFA Enabled
              </button>
              <button
                onClick={proceedToVerification}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Continue to Disable
              </button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Verify Your Identity</h3>
              <p className="text-gray-600 mb-4">
                Enter the 6-digit verification code from your authenticator app to confirm you want to disable MFA.
              </p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="000000"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
                maxLength={6}
                autoFocus
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Use the current 6-digit code from your authenticator app
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={disableMFA}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {debugInfo.includes('Creating') ? 'Creating...' : 
                     debugInfo.includes('Verifying') ? 'Verifying...' : 
                     debugInfo.includes('Disabling') ? 'Disabling...' : 'Processing...'}
                  </>
                ) : (
                  'Disable MFA'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}