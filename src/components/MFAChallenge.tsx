import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, AlertCircle, RefreshCw, Clock, CheckCircle } from 'lucide-react';

interface MFAChallengeProps {
  onSuccess: () => void;
  onCancel: () => void;
  factorId?: string | null;
}

export default function MFAChallenge({ onSuccess, onCancel, factorId }: MFAChallengeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    initializeChallenge();
  }, []);

  // Auto-clear error after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const initializeChallenge = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo('Initializing MFA challenge...');

      let totpFactorId = factorId;

      // If no factor ID provided, get it from the user's factors
      if (!totpFactorId) {
        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        
        if (factorsError) {
          console.error('Error listing MFA factors:', factorsError);
          setError('Failed to load MFA settings. Please try again.');
          return;
        }

        const totpFactor = factors?.totp?.find(factor => factor.status === 'verified');
        if (!totpFactor) {
          setError('No verified MFA factor found. Please contact support.');
          return;
        }

        totpFactorId = totpFactor.id;
      }

      setDebugInfo('Creating verification challenge...');
      console.log('Creating MFA challenge for factor:', totpFactorId);

      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: totpFactorId
      });

      if (error) {
        console.error('MFA challenge error:', error);
        
        if (error.message?.includes('mfa_disabled')) {
          setError('Multi-factor authentication is disabled.');
        } else if (error.message?.includes('factor_not_found')) {
          setError('MFA factor not found. Please set up MFA again.');
        } else if (error.message?.includes('Failed to fetch')) {
          setError('Network connection issue. Please check your internet and try again.');
        } else {
          setError(`Failed to initialize MFA challenge: ${error.message}`);
        }
        return;
      }

      if (data?.id) {
        setChallengeId(data.id);
        setDebugInfo('Challenge ready! Please enter your 6-digit code.');
        console.log('MFA challenge created successfully:', data.id);
      } else {
        setError('No challenge ID received. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected error during MFA challenge initialization:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!challengeId || !verificationCode || verificationCode.length !== 6) {
      setError('Please enter a complete 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo('Verifying your code...');

      console.log('Verifying MFA code for challenge:', challengeId);

      const { data, error } = await supabase.auth.mfa.verify({
        factorId: factorId || challengeId,
        challengeId: challengeId,
        code: verificationCode.trim()
      });

      if (error) {
        console.error('MFA verification error:', error);
        
        if (error.message?.includes('invalid_code') || error.message?.includes('Invalid TOTP code')) {
          setRetryCount(prev => prev + 1);
          setError('Invalid verification code. Please check your authenticator app and try again.');
        } else if (error.message?.includes('expired')) {
          setError('Verification code has expired. Please try again with a new code.');
        } else if (error.message?.includes('challenge_expired')) {
          setError('Verification session expired. Please try again.');
          // Reinitialize the challenge
          setTimeout(() => {
            initializeChallenge();
          }, 2000);
        } else if (error.message?.includes('too_many_attempts')) {
          setError('Too many failed attempts. Please wait before trying again.');
        } else if (error.message?.includes('Failed to fetch')) {
          setError('Network error during verification. Please check your connection and try again.');
        } else {
          setError(`Verification failed: ${error.message}`);
        }
        
        // Clear the code on error
        setVerificationCode('');
        setDebugInfo('');
        return;
      }

      if (data) {
        console.log('MFA verification successful');
        setDebugInfo('Verification successful!');
        
        // Brief success indication before calling onSuccess
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (err) {
      console.error('Unexpected error during MFA verification:', err);
      setError('An unexpected error occurred during verification. Please try again.');
      setVerificationCode('');
      setDebugInfo('');
    } finally {
      setIsLoading(false);
    }
  };

  const retryChallenge = () => {
    setError(null);
    setDebugInfo('');
    setVerificationCode('');
    setChallengeId(null);
    setRetryCount(0);
    initializeChallenge();
  };

  const handleCodeChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(cleanValue);
    
    if (error && cleanValue.length > 0) {
      setError(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length === 6 && challengeId && !isLoading) {
      verifyCode();
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
      </div>

      {debugInfo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
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
            <div>
              <p className="text-red-800 font-medium">Verification Failed</p>
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
          <button
            onClick={retryChallenge}
            className="mt-3 flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}

      {debugInfo.includes('successful') && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 font-medium">Verification Successful!</p>
          </div>
        </div>
      )}

      {!error && !debugInfo.includes('successful') && (
        <div className="space-y-6">
          <div>
            <p className="text-gray-600 mb-4">
              Enter the 6-digit verification code from your authenticator app.
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter 6-digit code"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
              maxLength={6}
              autoFocus
              disabled={isLoading || !challengeId}
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
              onClick={verifyCode}
              disabled={isLoading || verificationCode.length !== 6 || !challengeId}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
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