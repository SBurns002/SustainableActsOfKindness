import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Lock, CheckCircle, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPassword: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  useEffect(() => {
    const checkResetToken = async () => {
      try {
        // Parse URL parameters from both search params and hash
        const urlParams = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.substring(1));
        
        // Check for tokens in both locations (Supabase can send them either way)
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const type = urlParams.get('type') || hashParams.get('type');
        const tokenHash = urlParams.get('token_hash') || hashParams.get('token_hash');

        console.log('Reset password URL analysis:', {
          fullUrl: window.location.href,
          searchParams: location.search,
          hashParams: location.hash,
          parsedTokens: {
            accessToken: accessToken ? 'present' : 'missing',
            refreshToken: refreshToken ? 'present' : 'missing',
            type,
            tokenHash: tokenHash ? 'present' : 'missing'
          }
        });

        setTokenInfo({
          accessToken: !!accessToken,
          refreshToken: !!refreshToken,
          type,
          tokenHash: !!tokenHash
        });

        // Check if this is a valid password reset request
        if (type === 'recovery') {
          if (tokenHash) {
            // Method 1: Token hash approach (recommended for newer Supabase versions)
            console.log('Using token hash verification method');
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'recovery'
            });

            if (error) {
              console.error('Token hash verification failed:', error);
              throw new Error(`Invalid or expired reset link: ${error.message}`);
            }

            console.log('Token hash verification successful:', data);
            setIsValidToken(true);
            toast.success('Reset link verified! You can now set your new password.');
            
          } else if (accessToken && refreshToken) {
            // Method 2: Direct token approach (for older Supabase versions)
            console.log('Using direct token method');
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (error) {
              console.error('Session setup failed:', error);
              throw new Error(`Invalid or expired reset tokens: ${error.message}`);
            }

            console.log('Session setup successful:', data);
            setIsValidToken(true);
            toast.success('Reset link verified! You can now set your new password.');
            
          } else {
            throw new Error('Missing required authentication tokens. Please request a new password reset link.');
          }

          // Clean up URL parameters for security
          const newUrl = new URL(window.location.href);
          newUrl.search = '';
          newUrl.hash = '';
          window.history.replaceState({}, '', newUrl.toString());
          
        } else {
          // No valid reset parameters found
          throw new Error('Invalid password reset link. Please request a new one.');
        }
      } catch (error: any) {
        console.error('Token validation error:', error);
        setIsValidToken(false);
        toast.error(error.message || 'Invalid or expired reset link');
        
        // Redirect to auth page after a delay
        setTimeout(() => {
          navigate('/auth');
        }, 5000);
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkResetToken();
  }, [location, navigate]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting to update password...');
      
      // Update the user's password
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        throw error;
      }

      console.log('Password update successful:', data);
      toast.success('Password updated successfully! You are now signed in.');
      
      // Small delay to ensure the session is fully established
      setTimeout(() => {
        navigate('/profile');
      }, 1000);
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      if (error.message?.includes('session_not_found') || error.message?.includes('Invalid session')) {
        toast.error('Reset session expired. Please request a new password reset link.');
        setTimeout(() => navigate('/auth'), 2000);
      } else if (error.message?.includes('same_password')) {
        toast.error('New password must be different from your current password.');
      } else if (error.message?.includes('Password should be at least')) {
        toast.error('Password must be at least 6 characters long.');
      } else if (error.message?.includes('Auth session missing')) {
        toast.error('Authentication session expired. Please request a new reset link.');
        setTimeout(() => navigate('/auth'), 2000);
      } else {
        toast.error(error.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Verifying reset link...</p>
          <p className="text-sm text-gray-500">This may take a few seconds</p>
          
          {tokenInfo && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
              <p className="text-blue-800 text-xs font-medium mb-2">Debug Info:</p>
              <ul className="text-blue-700 text-xs space-y-1">
                <li>Access Token: {tokenInfo.accessToken ? '✓' : '✗'}</li>
                <li>Refresh Token: {tokenInfo.refreshToken ? '✓' : '✗'}</li>
                <li>Token Hash: {tokenInfo.tokenHash ? '✓' : '✗'}</li>
                <li>Type: {tokenInfo.type || 'missing'}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-amber-800 text-sm">
              <strong>Common causes:</strong><br />
              • Link has expired (links are valid for 1 hour)<br />
              • Link has already been used<br />
              • Link was copied incorrectly<br />
              • Email client modified the link
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-blue-800 text-sm">
              <strong>Need help?</strong><br />
              If you continue having issues, please contact our support team with the error details.
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/auth')}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Request New Reset Link
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={() => navigate('/auth')}
          className="mb-4 flex items-center text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sign In
        </button>
        
        <div className="flex justify-center mb-6">
          <div className="bg-emerald-100 p-4 rounded-full">
            <Lock className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your new password below to complete the reset process
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handlePasswordReset}>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-emerald-900">Reset Link Verified</h4>
                  <p className="text-sm text-emerald-800 mt-1">
                    Your password reset link is valid. You can now set a new password for your account.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Enter your new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 6 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Confirm your new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-600">
                  Passwords do not match
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-blue-900 font-medium text-sm mb-2">Password Requirements:</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li className={`flex items-center ${password.length >= 6 ? 'text-green-700' : ''}`}>
                  <span className="mr-2">{password.length >= 6 ? '✓' : '•'}</span>
                  At least 6 characters long
                </li>
                <li className={`flex items-center ${password && confirmPassword && password === confirmPassword ? 'text-green-700' : ''}`}>
                  <span className="mr-2">{password && confirmPassword && password === confirmPassword ? '✓' : '•'}</span>
                  Passwords match
                </li>
              </ul>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !password || !confirmPassword || password !== confirmPassword || password.length < 6}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Updating Password...
                  </div>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                After updating your password, you'll be automatically signed in and redirected to your profile.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;