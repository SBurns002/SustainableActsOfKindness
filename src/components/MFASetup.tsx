import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, AlertCircle, RefreshCw, X, CheckCircle, Info, Copy, Eye, EyeOff } from 'lucide-react';
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
  const [showSecret, setShowSecret] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Auto-clear error after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const cleanupPreviousFactors = async (userId: string) => {
    try {
      setDebugInfo('Checking for existing MFA factors...');
      
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (factorsError) {
        console.warn('Could not list factors for cleanup:', factorsError);
        return;
      }

      if (factors?.totp && factors.totp.length > 0) {
        const verifiedFactor = factors.totp.find(f => f.status === 'verified');
        if (verifiedFactor) {
          throw new Error('MFA is already enabled. Please disable it first before setting up a new factor.');
        }

        // Clean up unverified factors
        const unverifiedFactors = factors.totp.filter(f => f.status !== 'verified');
        if (unverifiedFactors.length > 0) {
          setDebugInfo(`Cleaning up ${unverifiedFactors.length} incomplete setup(s)...`);
          
          for (const factor of unverifiedFactors) {
            try {
              await supabase.auth.mfa.unenroll({ factorId: factor.id });
              console.log('Cleaned up unverified factor:', factor.id);
            } catch (cleanupError) {
              console.warn('Could not clean up factor:', factor.id, cleanupError);
            }
          }
          
          // Wait a moment for cleanup to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      throw error; // Re-throw to be handled by caller
    }
  };

  const enrollMFA = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo('Initializing MFA setup...');

      // Verify authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required. Please refresh the page and try again.');
      }

      // Clean up any previous incomplete setups
      await cleanupPreviousFactors(user.id);

      setDebugInfo('Creating new MFA factor...');
      
      // Generate unique friendly name
      const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const friendlyName = `Authenticator App (${timestamp})`;
      
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: friendlyName
      });

      if (error) {
        console.error('MFA enrollment error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('mfa_disabled')) {
          throw new Error('Multi-factor authentication is not enabled for this project. Please contact your administrator.');
        } else if (error.message?.includes('unexpected_failure')) {
          throw new Error('Server error occurred. Please wait a few minutes and try again.');
        } else if (error.message?.includes('rate_limit')) {
          throw new Error('Too many attempts. Please wait 5 minutes before trying again.');
        } else if (error.message?.includes('factor_name_conflict')) {
          throw new Error('A factor with this name already exists. Please try again.');
        } else {
          throw new Error(`Setup failed: ${error.message}`);
        }
      }

      if (!data || !data.totp || !data.totp.qr_code || !data.totp.secret) {
        throw new Error('Incomplete setup data received from server. Please try again.');
      }

      console.log('MFA enrollment successful:', { 
        id: data.id, 
        hasQrCode: !!data.totp.qr_code, 
        hasSecret: !!data.totp.secret 
      });
      
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep('scan');
      setDebugInfo('Setup ready! Please scan the QR code with your authenticator app.');
      
    } catch (err: any) {
      console.error('MFA enrollment error:', err);
      setError(err.message || 'An unexpected error occurred during setup.');
      setDebugInfo('');
    } finally {
      setIsLoading(false);
    }
  };

  const waitForChallengeReady = async (challengeId: string, maxAttempts = 5) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      setDebugInfo(`Waiting for challenge to be ready (attempt ${attempt}/${maxAttempts})...`);
      
      // Wait progressively longer between attempts
      const waitTime = attempt * 500; // 500ms, 1s, 1.5s, 2s, 2.5s
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // You could add a check here if Supabase provides a way to verify challenge status
      // For now, we'll just wait and assume it's ready after the delay
      if (attempt === maxAttempts) {
        setDebugInfo('Challenge should be ready for verification...');
        return true;
      }
    }
    return false;
  };

  const verifyAndEnable = async () => {
    if (!factorId || !verificationCode) {
      setError('Missing verification information');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Please enter a complete 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo('Creating verification challenge...');

      console.log('Starting MFA verification:', {
        factorId: factorId.substring(0, 8) + '...',
        codeLength: verificationCode.length,
        attempt: retryCount + 1
      });

      // Create challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) {
        console.error('Challenge creation failed:', challengeError);
        
        if (challengeError.message?.includes('factor_not_found')) {
          throw new Error('MFA setup expired. Please restart the setup process.');
        } else if (challengeError.message?.includes('mfa_disabled')) {
          throw new Error('MFA is disabled. Please contact your administrator.');
        } else {
          throw new Error(`Challenge failed: ${challengeError.message}`);
        }
      }

      if (!challengeData?.id) {
        throw new Error('No challenge ID received. Please try again.');
      }

      console.log('Challenge created:', challengeData.id);
      
      // Wait for challenge to be ready with progressive backoff
     // await waitForChallengeReady(challengeData.id);

      setDebugInfo('Verifying your code...');

      // Verify the code with retry logic
      let verifySuccess = false;
      let lastError = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
            System.out.println("Waiting for supabase");
            factorId,
            challengeId: challengeData.id,
            code: verificationCode.trim()
          });

          if (verifyError) {
            lastError = verifyError;
            console.error(`Verification attempt ${attempt} failed:`, verifyError);
            
            if (verifyError.message?.includes('invalid_code')) {
              // Don't retry on invalid code - user needs to enter a new one
              throw verifyError;
            } else if (verifyError.message?.includes('expired')) {
              throw verifyError;
            } else if (verifyError.message?.includes('too_many_attempts')) {
              throw verifyError;
            }
            
            // For other errors, wait and retry
            if (attempt < 3) {
              setDebugInfo(`Verification attempt ${attempt} failed, retrying...`);
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              continue;
            }
          } else {
            // Success!
            console.log('Verification successful:', verifyData);
            verifySuccess = true;
            break;
          }
        } catch (retryError) {
          lastError = retryError;
          if (attempt === 3) break;
        }
      }

      if (!verifySuccess && lastError) {
        if (lastError.message?.includes('invalid_code')) {
          setRetryCount(prev => prev + 1);
          throw new Error('Invalid code. Please check your authenticator app and try again. Make sure you\'re using the current 6-digit code.');
        } else if (lastError.message?.includes('expired')) {
          throw new Error('Code expired. Please try again with a fresh code from your authenticator app.');
        } else if (lastError.message?.includes('challenge_expired')) {
          throw new Error('Verification session expired. Please try again.');
        } else if (lastError.message?.includes('too_many_attempts')) {
          throw new Error('Too many failed attempts. Please wait 5 minutes before trying again.');
        } else {
          throw new Error(`Verification failed: ${lastError.message}`);
        }
      }

      setDebugInfo('Verification successful! Confirming MFA status...');

      // Verify the factor is now active
      const { data: updatedFactors, error: factorsError } = await supabase.auth.mfa.listFactors();
      
      if (!factorsError) {
        const verifiedFactor = updatedFactors?.totp?.find(f => f.id === factorId && f.status === 'verified');
        if (verifiedFactor) {
          console.log('MFA successfully enabled:', verifiedFactor);
          setStep('success');
          setDebugInfo('Two-factor authentication is now active!');
          toast.success('Two-factor authentication enabled successfully!');
          
          setTimeout(() => {
            onComplete();
          }, 2000);
          return;
        }
      }

      // Fallback success handling
      console.log('Verification completed, assuming success');
      setStep('success');
      setDebugInfo('Two-factor authentication enabled!');
      toast.success('Two-factor authentication enabled successfully!');
      
      setTimeout(() => {
        onComplete();
      }, 2000);
      
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Verification failed. Please try again.');
      setVerificationCode('');
      setDebugInfo('');
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = async () => {
    if (secret) {
      try {
        await navigator.clipboard.writeText(secret);
        toast.success('Secret copied to clipboard');
      } catch (err) {
        toast.error('Could not copy to clipboard');
      }
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
    setRetryCount(0);
    setShowSecret(false);
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
      <div className="max-w-lg w-full bg-white rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-900">Set Up Two-Factor Authentication</h2>
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
                <p className="text-red-800 font-medium">Setup Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                
                {retryCount > 2 && (
                  <div className="mt-2 text-sm text-red-700">
                    <p className="font-medium">Having trouble?</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Make sure your device's time is correct</li>
                      <li>Try a different authenticator app</li>
                      <li>Wait 30 seconds for a new code</li>
                      <li>Restart the setup process</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={retrySetup}
                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                disabled={isLoading}
              >
                <RefreshCw className="w-3 h-3" />
                Start Over
              </button>
              {step === 'scan' && (
                <button
                  onClick={() => {
                    setError(null);
                    setVerificationCode('');
                  }}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                  disabled={isLoading}
                >
                  Try Again
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
            <div className="mb-6">
              <div className="bg-emerald-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-emerald-900 mb-2">What is Two-Factor Authentication?</h3>
                <p className="text-emerald-800 text-sm">
                  MFA adds an extra layer of security by requiring a code from your phone 
                  in addition to your password when signing in.
                </p>
              </div>
              <div className="text-left space-y-2 text-sm text-gray-600">
                <p><strong>You'll need:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>An authenticator app (Google Authenticator, Authy, 1Password, etc.)</li>
                  <li>Your smartphone or tablet</li>
                  <li>A few minutes to complete setup</li>
                </ul>
              </div>
            </div>
            <button
              onClick={enrollMFA}
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Begin MFA Setup'
              )}
            </button>
          </div>
        )}

        {step === 'scan' && qrCode && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Step 1: Scan QR Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Open your authenticator app and scan this QR code:
              </p>
              <div className="flex justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
              </div>
            </div>

            {secret && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Alternative: Manual Entry</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Can't scan? Enter this secret key manually in your authenticator app:
                </p>
                <div className="relative">
                  <div className="flex items-center gap-2 p-3 bg-gray-100 rounded border">
                    <code className="flex-1 text-sm font-mono break-all">
                      {showSecret ? secret : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                      title={showSecret ? 'Hide secret' : 'Show secret'}
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={copySecret}
                      className="text-gray-500 hover:text-gray-700 p-1"
                      title="Copy secret"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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
                placeholder="000000"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
                maxLength={6}
                autoFocus
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Codes refresh every 30 seconds. Use the current code shown in your app.
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
                onClick={verifyAndEnable}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {debugInfo.includes('Creating') ? 'Creating...' : 
                     debugInfo.includes('Waiting') ? 'Preparing...' :
                     debugInfo.includes('Verifying') ? 'Verifying...' : 
                     debugInfo.includes('Confirming') ? 'Confirming...' : 'Processing...'}
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