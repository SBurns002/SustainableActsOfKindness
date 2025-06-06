import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, AlertCircle, RefreshCw } from 'lucide-react';

interface MFAChallengeProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MFAChallenge({ onSuccess, onCancel }: MFAChallengeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);

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
        setError('No MFA factor found. Please set up MFA first.');
        return;
      }

      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id
      });

      if (error) {
        console.error('MFA challenge error:', error);
        
        if (error.message?.includes('mfa_disabled')) {
          setError('Multi-factor authentication is disabled.');
        } else if (error.message?.includes('factor_not_found')) {
          setError('MFA factor not found. Please set up MFA again.');
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

  const verifyCode = async () => {
    if (!challengeId || !verificationCode) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.mfa.verify({
        factorId: challengeId,
        challengeId,
        code: verificationCode
      });

      if (error) {
        console.error('MFA verification error:', error);
        
        if (error.message?.includes('invalid_code')) {
          setError('Invalid verification code. Please check your authenticator app and try again.');
        } else if (error.message?.includes('expired')) {
          setError('Verification code has expired. Please try again with a new code.');
        } else if (error.message?.includes('too_many_attempts')) {
          setError('Too many failed attempts. Please wait before trying again.');
        } else {
          setError(`Verification failed: ${error.message}`);
        }
        
        // Clear the code on error
        setVerificationCode('');
        return;
      }

      if (data) {
        onSuccess();
      }
    } catch (err) {
      console.error('Unexpected error during MFA verification:', err);
      setError('An unexpected error occurred during verification. Please try again.');
      setVerificationCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const retryChallenge = () => {
    setError(null);
    setVerificationCode('');
    setChallengeId(null);
    initializeChallenge();
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Verification Failed</p>
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
              Enter the 6-digit verification code from your authenticator app.
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
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
              onClick={verifyCode}
              disabled={isLoading || verificationCode.length !== 6 || !challengeId}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}