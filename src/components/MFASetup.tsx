import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, AlertCircle, RefreshCw, X, CheckCircle } from 'lucide-react';
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

  const enrollMFA = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo('Checking existing MFA factors...');

      // First check if user already has MFA enabled
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        console.error('Error checking existing factors:', factorsError);
      } else if (factors?.totp && factors.totp.length > 0) {
        const verifiedFactor = factors.totp.find(f => f.status === 'verified');
        if (verifiedFactor) {
          setError('You already have MFA enabled. Please disable it first before setting up a new factor.');
          return;
        }
      }

      setDebugInfo('Enrolling new MFA factor...');
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Authenticator App - ${new Date().toLocaleDateString()}`
      });

      if (error) {
        console.error('MFA enrollment error:', error);
        
        if (error.message?.includes('unexpected_failure')) {
          setError('MFA setup failed. This might be a temporary issue. Please try again in a few moments.');
        } else if (error.message?.includes('mfa_disabled')) {
          setError('Multi-factor authentication is disabled for this project.');
        } else if (error.message?.includes('factor_name_conflict') || error.message?.includes('already exists')) {
          setError('You already have MFA enabled. Please disable it first before setting up a new factor.');
        } else {
          setError(`Failed to set up MFA: ${error.message}`);
        }
        return;
      }

      if (data) {
        console.log('MFA enrollment successful:', data);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStep('scan');
        setDebugInfo('QR code generated successfully');
      }
    } catch (err) {
      console.error('Unexpected error during MFA enrollment:', err);
      setError('An unexpected error occurred. Please try again or contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!factorId || !verificationCode) return;

    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo('Starting verification process...');

      console.log('Starting MFA verification process:', {
        factorId: factorId.substring(0, 8) + '...',
        codeLength: verificationCode.length
      });

      // Use challengeAndVerify which is more reliable for initial setup
      setDebugInfo('Verifying code with challengeAndVerify...');
      
      const verificationPromise = supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode
      });

      // Increased timeout from 15 seconds to 60 seconds for better reliability
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Verification timed out after 60 seconds')), 60000);
      });

      const { data: verifyData, error: verifyError } = await Promise.race([
        verificationPromise,
        timeoutPromise
      ]) as any;

      if (verifyError) {
        console.error('MFA verification error:', verifyError);
        
        if (verifyError.message?.includes('invalid_code')) {
          setError('Invalid verification code. Please check your authenticator app and try again.');
        } else if (verifyError.message?.includes('expired')) {
          setError('Verification code has expired. Please try again with a new code.');
        } else if (verifyError.message?.includes('factor_id must be an UUID')) {
          setError('Invalid factor ID. Please restart the MFA setup process.');
          setStep('initial');
          setFactorId(null);
          setQrCode(null);
          setSecret(null);
        } else if (verifyError.message?.includes('timed out')) {
          setError('Verification timed out. Please try again with a fresh code.');
        } else {
          setError(`Verification failed: ${verifyError.message}`);
        }
        return;
      }

      if (verifyData) {
        console.log('MFA verification successful:', verifyData);
        setDebugInfo('Verification successful!');
        setStep('success');
        toast.success('Two-factor authentication has been successfully enabled!');
        
        // Refresh the page to show updated MFA status
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Unexpected error during MFA verification:', err);
      
      if (err.message?.includes('timed out')) {
        setError('Verification timed out. Please try again with a fresh code from your authenticator app.');
      } else {
        setError('An unexpected error occurred during verification. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Alternative verification method using separate challenge and verify
  const alternativeVerify = async () => {
    if (!factorId || !verificationCode) return;

    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo('Using alternative verification method...');

      console.log('Creating challenge for factor:', factorId);

      // Step 1: Create challenge
      const challengePromise = supabase.auth.mfa.challenge({
        factorId
      });

      // Increased timeout from 10 seconds to 60 seconds
      const challengeTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Challenge creation timed out after 60 seconds')), 60000);
      });

      const { data: challengeData, error: challengeError } = await Promise.race([
        challengePromise,
        challengeTimeoutPromise
      ]) as any;

      if (challengeError) {
        console.error('Challenge creation failed:', challengeError);
        throw new Error(`Challenge failed: ${challengeError.message}`);
      }

      if (!challengeData?.id) {
        throw new Error('No challenge ID received');
      }

      console.log('Challenge created:', challengeData.id);
      setDebugInfo('Challenge created, verifying code...');

      // Step 2: Verify with challenge
      const verifyPromise = supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode
      });

      // Increased timeout from 15 seconds to 60 seconds
      const verifyTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Verification timed out after 60 seconds')), 60000);
      });

      const { data: verifyData, error: verifyError } = await Promise.race([
        verifyPromise,
        verifyTimeoutPromise
      ]) as any;

      if (verifyError) {
        console.error('Alternative verification failed:', verifyError);
        
        if (verifyError.message?.includes('invalid_code')) {
          setError('Invalid verification code. Please check your authenticator app and try again.');
        } else if (verifyError.message?.includes('expired')) {
          setError('Verification code has expired. Please try again with a new code.');
        } else if (verifyError.message?.includes('timed out')) {
          setError('Alternative verification also timed out. Please check your internet connection.');
        } else {
          setError(`Alternative verification failed: ${verifyError.message}`);
        }
        return;
      }

      if (verifyData) {
        console.log('Alternative verification successful:', verifyData);
        setDebugInfo('Alternative verification successful!');
        setStep('success');
        toast.success('Two-factor authentication has been successfully enabled!');
        
        // Refresh the page to show updated MFA status
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Alternative verification error:', err);
      
      if (err.message?.includes('timed out')) {
        setError('Alternative verification also timed out. Please check your internet connection and try again.');
      } else {
        setError('Alternative verification failed. Please try restarting the setup process.');
      }
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
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-6">
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
            <p className="text-blue-800 text-sm font-medium">Status:</p>
            <p className="text-blue-700 text-sm">{debugInfo}</p>
          </div>
        )}

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
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={retrySetup}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
                disabled={isLoading}
              >
                <RefreshCw className="w-3 h-3 inline mr-1" />
                Try Again
              </button>
              {step === 'scan' && factorId && verificationCode.length === 6 && (
                <button
                  onClick={alternativeVerify}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  disabled={isLoading}
                >
                  Alternative Method
                </button>
              )}
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
                    {debugInfo.includes('Verifying') ? 'Verifying...' : 
                     debugInfo.includes('Challenge') ? 'Creating...' : 'Processing...'}
                  </>
                ) : (
                  'Verify & Enable'
                )}
              </button>
            </div>
            
            {verificationCode.length === 6 && !isLoading && (
              <p className="text-xs text-center text-gray-500">
                Tip: If verification hangs, try the "Alternative Method" button above
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}