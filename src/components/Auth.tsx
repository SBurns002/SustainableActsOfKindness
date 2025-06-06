import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import MFAChallenge from './MFAChallenge';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showMfaChallenge, setShowMfaChallenge] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth-status`,
            data: {
              email_confirm: false
            }
          }
        });
        if (error) throw error;
        
        // Sign in immediately after sign up
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        toast.success('Successfully signed up and logged in!');
        const returnTo = location.state?.returnTo || '/';
        navigate(returnTo);
      } else {
        // Sign in flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;

        // Check if user has MFA enabled
        if (data.user) {
          try {
            const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
            
            if (factorsError) {
              console.error('Error checking MFA factors:', factorsError);
              // Continue with normal login if we can't check MFA
              toast.success('Successfully logged in!');
              const returnTo = location.state?.returnTo || '/';
              navigate(returnTo);
              return;
            }

            const verifiedTotpFactor = factors?.totp?.find(factor => factor.status === 'verified');
            
            if (verifiedTotpFactor) {
              console.log('User has MFA enabled, showing challenge');
              setMfaFactorId(verifiedTotpFactor.id);
              setShowMfaChallenge(true);
              setLoading(false);
              return;
            }
          } catch (mfaError) {
            console.error('Error checking MFA status:', mfaError);
            // Continue with normal login if MFA check fails
          }
        }

        // No MFA required, complete login
        toast.success('Successfully logged in!');
        const returnTo = location.state?.returnTo || '/';
        navigate(returnTo);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Provide more specific error messages
      if (error.message === 'Failed to fetch') {
        toast.error('Unable to connect to authentication service. Please check your internet connection and try again.');
      } else if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
        // Show password reset option for sign in attempts with wrong credentials
        if (!isSignUp) {
          setTimeout(() => {
            toast((t) => (
              <div className="flex flex-col space-y-2">
                <span>Forgot your password?</span>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    setResetEmail(email);
                    setShowPasswordReset(true);
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-sm underline"
                >
                  Reset Password
                </button>
              </div>
            ), {
              duration: 8000,
              icon: '🔑'
            });
          }, 1000);
        }
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please check your email and confirm your account before signing in.');
      } else {
        toast.error(error.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      if (!showMfaChallenge) {
        setLoading(false);
      }
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      setResetSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      if (error.message.includes('Email not found')) {
        toast.error('No account found with this email address.');
      } else if (error.message.includes('Failed to fetch')) {
        toast.error('Unable to connect to authentication service. Please check your internet connection.');
      } else {
        toast.error(error.message || 'Failed to send password reset email. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleMfaSuccess = () => {
    setShowMfaChallenge(false);
    setMfaFactorId(null);
    toast.success('Successfully logged in with MFA!');
    const returnTo = location.state?.returnTo || '/';
    navigate(returnTo);
  };

  const handleMfaCancel = async () => {
    // Sign out the user since they didn't complete MFA
    await supabase.auth.signOut();
    setShowMfaChallenge(false);
    setMfaFactorId(null);
    setLoading(false);
    toast.info('Login cancelled. MFA verification is required.');
  };

  if (showMfaChallenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication Required
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please complete MFA verification to continue
          </p>
        </div>
        <div className="mt-8">
          <MFAChallenge
            onSuccess={handleMfaSuccess}
            onCancel={handleMfaCancel}
            factorId={mfaFactorId}
          />
        </div>
      </div>
    );
  }

  if (showPasswordReset) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <button
            onClick={() => {
              setShowPasswordReset(false);
              setResetSent(false);
              setResetEmail('');
            }}
            className="mb-4 flex items-center text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </button>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {resetSent ? (
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
                <p className="text-gray-600 mb-4">
                  We've sent a password reset link to <strong>{resetEmail}</strong>
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Didn't receive the email? Check your spam folder or try again with a different email address.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setResetSent(false);
                      setResetEmail('');
                    }}
                    className="w-full flex justify-center py-2 px-4 border border-emerald-600 text-emerald-600 rounded-md shadow-sm text-sm font-medium hover:bg-emerald-50 transition-colors"
                  >
                    Try Different Email
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordReset(false);
                      setResetSent(false);
                      setResetEmail('');
                    }}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 text-gray-700 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handlePasswordReset}>
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="reset-email"
                      name="email"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      placeholder="Enter your email address"
                    />
                    <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setShowPasswordReset(true);
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-500 font-medium"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : isSignUp ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center text-sm text-emerald-600 hover:text-emerald-500"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;