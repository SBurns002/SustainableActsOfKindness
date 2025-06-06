import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';

interface MFADisableProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MFADisable({ onSuccess, onCancel }: MFADisableProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);

  React.useEffect(() => {
    initializeChallenge();
  }, []);

  const initializeChallenge = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        console.error('Error listing MFA factors:', factorsError);
        setError('Failed to load MFA settings. Please try again.');
        return;
      }

      const totpFactor = factors?.totp?.[0];
      if (!totpFactor) {
        setError('No MFA factor found to disable.');
        return;
      }

      setFactorId(totpFactor.id);

      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id
      });

      if (error) {
        console.error('MFA challenge error:', error);
        
        if (error.message?.includes('mfa_disabled')) {
          setError('Multi-factor authentication is already disabled.');
        } else if (error.message?.includes('factor_not_found')) {
          setError('MFA factor not found.');
        } else {
          setError(`Failed to initialize MFA challenge: ${error.message}`);
        }
        return;
      }

      if (data) {
        setChallengeId(data.id);
      }
    } catch (err) {
      console.error('Unexpected error during MFA challenge initialization:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const disableMFA = async () => {
    if (!challengeId || !factorId || !verificationCode) return;

    try {
      setIsLoading(true);
      setError(null);

      // First verify the code
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verificationCode
      });

      if (verifyError) {
        console.error('MFA verification error:', verifyError);
        
        if (verifyError.message?.includes('invalid_code')) {
          setError('Invalid verification code. Please check your authenticator app and try again.');
        } else if (verifyError.message?.includes('expired')) {
          setError('Verification code has expired. Please try again with a new code.');
        } else if (verifyError.message?.includes('too_many_attempts')) {
          setError('Too many failed attempts. Please wait before trying again.');
        } else {
          setError(`Verification failed: ${verifyError.message}`);
        }
        
        setVerificationCode('');
        return;
      }

      // Then unenroll the factor
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId
      });

      if (unenrollError) {
        console.error('MFA unenroll error:', unenrollError);
        
        if (unenrollError.message?.includes('factor_not_found')) {
          setError('MFA factor not found or already disabled.');
        } else {
          setError(`Failed to disable MFA: ${unenrollError.message}`);
        }
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Unexpected error during MFA disable:', err);
      setError('An unexpected error occurred. Please try again.');
      setVerificationCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const retryChallenge = () => {
    setError(null);
    setVerificationCode('');
    setChallengeId(null);
    setFactorId(null);
    initializeChallenge();
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-red-600" />
        <h2 className="text-xl font-semibold text-gray-900">Disable Two-Factor Authentication</h2>
      </div>

      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-800 font-medium">Security Warning</p>
            <p className="text-amber-700 text-sm mt-1">
              Disabling two-factor authentication will make your account less secure. 
              Only proceed if you're sure you want to remove this protection.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={retryChallenge}
            className="mt-3 flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}

      {!error && (
        <div className="space-y-6">
          <div>
            <p className="text-gray-600 mb-4">
              To disable two-factor authentication, enter the 6-digit verification code from your authenticator app.
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-lg font-mono"
              maxLength={6}
              autoFocus
              disabled={isLoading || !challengeId}
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
              disabled={isLoading || verificationCode.length !== 6 || !challengeId}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                'Disable MFA'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}