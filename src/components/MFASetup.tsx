import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, AlertCircle, RefreshCw } from 'lucide-react';

interface MFASetupProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MFASetup({ onSuccess, onCancel }: MFASetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);

  const enrollMFA = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) {
        console.error('MFA enrollment error:', error);
        
        // Provide specific error messages based on error codes
        if (error.message?.includes('unexpected_failure')) {
          setError('MFA is not properly configured for this project. Please contact support or check the Supabase dashboard settings.');
        } else if (error.message?.includes('mfa_disabled')) {
          setError('Multi-factor authentication is disabled for this project.');
        } else if (error.message?.includes('factor_already_exists')) {
          setError('You already have MFA enabled. Please disable it first before setting up a new factor.');
        } else {
          setError(`Failed to set up MFA: ${error.message}`);
        }
        return;
      }

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
      }
    } catch (err) {
      console.error('Unexpected error during MFA enrollment:', err);
      setError('An unexpected error occurred. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMFA = async () => {
    if (!factorId || !verificationCode) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode
      });

      if (error) {
        console.error('MFA verification error:', error);
        
        if (error.message?.includes('invalid_code')) {
          setError('Invalid verification code. Please check your authenticator app and try again.');
        } else if (error.message?.includes('expired')) {
          setError('Verification code has expired. Please try again with a new code.');
        } else {
          setError(`Verification failed: ${error.message}`);
        }
        return;
      }

      if (data) {
        onSuccess();
      }
    } catch (err) {
      console.error('Unexpected error during MFA verification:', err);
      setError('An unexpected error occurred during verification. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const retrySetup = () => {
    setError(null);
    setQrCode(null);
    setSecret(null);
    setVerificationCode('');
    setFactorId(null);
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Set Up Two-Factor Authentication</h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Setup Failed</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
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
          <button
            onClick={retrySetup}
            className="mt-3 flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      )}

      {!qrCode && !error && (
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Two-factor authentication adds an extra layer of security to your account.
          </p>
          <button
            onClick={enrollMFA}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

      {qrCode && (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Step 1: Scan QR Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
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
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={6}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={verifyMFA}
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Enable'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}