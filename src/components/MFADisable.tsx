import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface MFADisableProps {
  onSuccess: () => void;
  onCancel: () => void;
  totpFactorId: string;
}

const MFADisable: React.FC<MFADisableProps> = ({ onSuccess, onCancel, totpFactorId }) => {
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const disableMFA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);

      // First verify the current code
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactorId,
        code: verificationCode
      });

      if (verifyError) throw verifyError;

      // Then unenroll MFA
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: totpFactorId
      });

      if (unenrollError) throw unenrollError;

      toast.success('MFA has been successfully disabled');
      onSuccess();
    } catch (error: any) {
      console.error('Error disabling MFA:', error);
      if (error.message.includes('Invalid TOTP code')) {
        toast.error('Invalid verification code. Please check your authenticator app and try again.');
      } else {
        toast.error('Failed to disable MFA. Please try again.');
      }
      setVerificationCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length === 6) {
      disableMFA();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify to Disable MFA
          </h2>
          <p className="text-gray-600">
            Enter your current verification code to confirm
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Security Warning:</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Disabling MFA will make your account less secure. Make sure you have alternative security measures in place.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter verification code from your authenticator app:
            </label>
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

          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={disableMFA}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Disabling...</span>
                </>
              ) : (
                <span>Disable MFA</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MFADisable;