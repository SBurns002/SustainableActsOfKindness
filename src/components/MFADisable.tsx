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

  const disableMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo('Creating challenge...');

      console.log('Starting MFA disable process for factor:', totpFactorId);

      // Step 1: Create challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactorId
      });

      if (challengeError) {
        console.error('Challenge creation failed:', challengeError);
        setError(`Failed to create challenge: ${challengeError.message}`);
        return;
      }

      if (!challengeData?.id) {
        setError('No challenge ID received from server');
        return;
      }

      console.log('Challenge created successfully:', challengeData.id);
      setDebugInfo('Challenge created, verifying code...');

      // Step 2: Verify the code
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactorId,
        challengeId: challengeData.id,
        code: verificationCode
      });

      if (verifyError) {
        console.error('Verification failed:', verifyError);
        
        if (verifyError.message?.includes('invalid_code')) {
          setError('Invalid verification code. Please check your authenticator app and try again.');
        } else if (verifyError.message?.includes('expired')) {
          setError('Verification code has expired. Please try again with a new code.');
        } else if (verifyError.message?.includes('challenge_expired')) {
          setError('Challenge expired. Please try again.');
        } else {
          setError(`Verification failed: ${verifyError.message}`);
        }
        return;
      }

      console.log('Code verified successfully:', verifyData);
      setDebugInfo('Code verified. Disabling MFA...');

      // Step 3: Unenroll the factor
      console.log('Attempting to unenroll factor:', totpFactorId);

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: totpFactorId
      });

      if (unenrollError) {
        console.error('Unenroll failed:', unenrollError);
        setError(`Failed to disable MFA: ${unenrollError.message}`);
        return;
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
                <div className="mt-3">
                  <button
                    onClick={retryProcess}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                    disabled={isLoading}
                  >
                    <RefreshCw className="w-3 h-3 inline mr-1" />
                    Retry
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
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {debugInfo.includes('Creating') ? 'Creating...' : 
                       debugInfo.includes('verifying') ? 'Verifying...' : 
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