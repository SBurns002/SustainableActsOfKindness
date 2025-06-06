import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Smartphone, Key, Copy, Check, AlertTriangle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

interface MFASetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

const MFASetup: React.FC<MFASetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    enrollMFA();
  }, []);

  const enrollMFA = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });

      if (error) throw error;

      if (data) {
        setSecret(data.totp.secret);
        setFactorId(data.id);
        
        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(data.totp.uri);
        setQrCodeUrl(qrCodeDataUrl);
      }
    } catch (error: any) {
      console.error('Error enrolling MFA:', error);
      toast.error('Failed to set up MFA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factorId,
        code: verificationCode
      });

      if (error) throw error;

      toast.success('MFA has been successfully enabled!');
      onComplete();
    } catch (error: any) {
      console.error('Error verifying MFA:', error);
      if (error.message.includes('Invalid TOTP code')) {
        toast.error('Invalid verification code. Please check your authenticator app and try again.');
      } else {
        toast.error('Failed to verify MFA code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toast.success('Secret key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy secret key');
    }
  };

  if (loading && !qrCodeUrl) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Setting up Multi-Factor Authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 'setup' ? 'Set Up Multi-Factor Authentication' : 'Verify Your Setup'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {step === 'setup' && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800">Important Security Information</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Multi-Factor Authentication adds an extra layer of security to your account. 
                    You'll need an authenticator app to generate verification codes.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Smartphone className="w-5 h-5 mr-2" />
                  Step 1: Scan QR Code
                </h3>
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="MFA QR Code" className="mx-auto" />
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Use your authenticator app to scan this QR code
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  Step 2: Manual Entry (Optional)
                </h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    If you can't scan the QR code, manually enter this secret key in your authenticator app:
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-mono break-all">{secret}</code>
                      <button
                        onClick={copySecret}
                        className="ml-2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Recommended Apps:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Google Authenticator</li>
                    <li>• Microsoft Authenticator</li>
                    <li>• Authy</li>
                    <li>• 1Password</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('verify')}
                disabled={!qrCodeUrl}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                Continue to Verification
              </button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="bg-emerald-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Enter Verification Code
              </h3>
              <p className="text-gray-600">
                Open your authenticator app and enter the 6-digit code for this account
              </p>
            </div>

            <div className="max-w-xs mx-auto">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg py-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                maxLength={6}
              />
              <p className="text-xs text-gray-500 text-center mt-2">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• MFA will be enabled for your account</li>
                <li>• You'll need your authenticator app to sign in</li>
                <li>• Your account will be more secure</li>
                <li>• You can disable MFA anytime from your profile</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('setup')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <div className="space-x-4">
                <button
                  onClick={onCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={verifyAndEnable}
                  disabled={loading || verificationCode.length !== 6}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Enable MFA'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MFASetup;