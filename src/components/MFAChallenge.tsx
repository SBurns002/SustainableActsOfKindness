import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Smartphone, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface MFAChallengeProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const MFAChallenge: React.FC<MFAChallengeProps> = ({ onSuccess, onCancel }) => {
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const verifyMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.mfa.verify({
        factorId: 'totp',
        code: verificationCode
      });

      if (error) throw error;

      toast.success('Successfully verified!');
      onSuccess();
    } catch (error: any) {
      console.error('Error verifying MFA:', error);
      if (error.message.includes('Invalid TOTP code')) {
        toast.error('Invalid verification code. Please check your authenticator app and try again.');
      } else {
        toast.error('Failed to verify code. Please try again.');
      }
      setVerificationCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length === 6) {
      verifyMFA();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="bg-emerald-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
            <Shield className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-gray-600">
            Enter the verification code from your authenticator app
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyPress={handleKeyPress}
              placeholder="000000"
              className="w-full text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg py-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              maxLength={6}
              autoFocus
            />
            <p className="text-xs text-gray-500 text-center mt-2">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Need help?</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Open your authenticator app (Google Authenticator, Authy, etc.) and find the 6-digit code for this account.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={verifyMFA}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MFAChallenge;