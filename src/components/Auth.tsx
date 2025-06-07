import React, { useState, useEffect } from 'react';
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
  const [resetAttempted, setResetAttempted] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Check URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isPasswordReset = urlParams.get('reset') === 'true';
    const hasError = urlParams.get('error');
    const hasErrorDescription = urlParams.get('error_description');
    const isEmailConfirmed = urlParams.get('type') === 'signup';

    if (isEmailConfirmed) {
      // User clicked email confirmation link
      toast.success('Email confirmed successfully! You can now sign in.');
      // Clear the URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('type');
      newUrl.searchParams.delete('token_hash');
      window.history.replaceState({}, '', newUrl.toString());
    }

    if (isPasswordReset) {
      setShowPasswordReset(true);
      setResetSent(false);
      setResetAttempted(false);
      
      toast.info('You clicked a password reset link. Please enter your email to send a new reset email.', {
        duration: 6000
      });
    }

    if (hasError) {
      const errorMsg = hasErrorDescription || hasError;
      toast.error(`Authentication error: ${errorMsg}`);
      
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('error_description');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [location.search]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?type=signup`,
            data: {
              email_confirm: true // Enable email confirmation
            }
          }
        });

        if (error) throw error;

        // Show email confirmation message
        setConfirmationEmail(email);
        setShowEmailConfirmation(true);
        toast.success('Please check your email to confirm your account before signing in.');
        
      } else {
        // Sign in flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;

        // Check if email is confirmed
        if (data.user && !data.user.email_confirmed_at) {
          toast.error('Please confirm your email address before signing in. Check your inbox for a confirmation link.');
          setLoading(false);
          return;
        }

        // Check if user has MFA enabled
        if (data.user) {
          try {
            const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
            
            if (factorsError) {
              console.error('Error checking MFA factors:', factorsError);
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
          }
        }

        toast.success('Successfully logged in!');
        const returnTo = location.state?.returnTo || '/';
        navigate(returnTo);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      if (error.message === 'Failed to fetch') {
        toast.error('Unable to connect to authentication service. Please check your internet connection and try again.');
      } else if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please check your credentials and try again.');
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
                    setResetSent(false);
                    setResetAttempted(false);
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
      } else if (error.message.includes('Signup requires a valid password')) {
        toast.error('Password must be at least 6 characters long.');
      } else if (error.message.includes('User already registered')) {
        toast.error('An account with this email already exists. Please sign in instead.');
        setIsSignUp(false);
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

    if (resetLoading) {
      return;
    }

    setResetLoading(true);
    setResetAttempted(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
        data: {
          app_name: 'Sustainable Acts of Kindness',
          app_description: 'Environmental Community Platform',
          support_email: 'support@sustainableactsofkindness.org',
          website_url: window.location.origin,
          reset_reason: 'password_reset_request',
          user_email: resetEmail,
          timestamp: new Date().toISOString()
        }
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
      } else if (error.message.includes('rate_limit') || error.message.includes('too_many_requests')) {
        toast.error('Too many password reset attempts. Please wait a few minutes before trying again.');
      } else {
        toast.error(error.message || 'Failed to send password reset email. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const resendConfirmationEmail = async () => {
    if (!confirmationEmail) return;

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: confirmationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?type=signup`
        }
      });

      if (error) throw error;
      toast.success('Confirmation email resent! Please check your inbox.');
    } catch (error: any) {
      console.error('Error resending confirmation:', error);
      toast.error('Failed to resend confirmation email. Please try again.');
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
    await supabase.auth.signOut();
    setShowMfaChallenge(false);
    setMfaFactorId(null);
    setLoading(false);
    toast.info('Login cancelled. MFA verification is required.');
  };

  const resetPasswordResetState = () => {
    setShowPasswordReset(false);
    setResetSent(false);
    setResetEmail('');
    setResetAttempted(false);
    setResetLoading(false);
    
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('reset');
    window.history.replaceState({}, '', newUrl.toString());
  };

  const resetEmailConfirmationState = () => {
    setShowEmailConfirmation(false);
    setConfirmationEmail('');
    setEmail('');
    setPassword('');
    setIsSignUp(false);
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

  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <button
            onClick={resetEmailConfirmationState}
            className="mb-4 flex items-center text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </button>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Check Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a confirmation link to verify your account
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Your Email Address</h3>
              <p className="text-gray-600 mb-4">
                We've sent a confirmation email to <strong>{confirmationEmail}</strong>
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-emerald-800">
                  <strong>Next steps:</strong>
                </p>
                <ol className="text-sm text-emerald-700 mt-2 list-decimal list-inside space-y-1">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the confirmation link in the email</li>
                  <li>Return here to sign in with your credentials</li>
                </ol>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Didn't receive the email? Check your spam folder or request a new one.
              </p>
              <div className="space-y-3">
                <button
                  onClick={resendConfirmationEmail}
                  className="w-full flex justify-center py-2 px-4 border border-emerald-600 text-emerald-600 rounded-md shadow-sm text-sm font-medium hover:bg-emerald-50 transition-colors"
                >
                  Resend Confirmation Email
                </button>
                <button
                  onClick={resetEmailConfirmationState}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 text-gray-700 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showPasswordReset) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <button
            onClick={resetPasswordResetState}
            className="mb-4 flex items-center text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </button>
          
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a secure link to reset your password for your Sustainable Acts of Kindness account
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
                  We've sent a password reset link for your <strong>Sustainable Acts of Kindness</strong> account to <strong>{resetEmail}</strong>
                </p>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-emerald-800">
                    <strong>Look for an email from Sustainable Acts of Kindness</strong> with the subject line "Reset your password". 
                    The email will contain a secure link to create a new password for your environmental community platform account.
                  </p>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Didn't receive the email? Check your spam folder or try again with a different email address.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setResetSent(false);
                      setResetEmail('');
                      setResetAttempted(false);
                    }}
                    className="w-full flex justify-center py-2 px-4 border border-emerald-600 text-emerald-600 rounded-md shadow-sm text-sm font-medium hover:bg-emerald-50 transition-colors"
                  >
                    Try Different Email
                  </button>
                  <button
                    onClick={resetPasswordResetState}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 text-gray-700 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handlePasswordReset}>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-emerald-900">Secure Password Reset</h4>
                      <p className="text-sm text-emerald-800 mt-1">
                        We'll send you a secure email with instructions to reset your password for your Sustainable Acts of Kindness account.
                      </p>
                    </div>
                  </div>
                </div>

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
                      disabled={resetLoading}
                    />
                    <Mail className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    This must be the email address associated with your Sustainable Acts of Kindness account
                  </p>
                </div>

                {resetAttempted && !resetSent && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Email sent!</strong> If you don't see it in a few minutes, check your spam folder.
                    </p>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={resetLoading || !resetEmail.trim()}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resetLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending Reset Email...
                      </div>
                    ) : (
                      'Send Password Reset Email'
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    By clicking "Send Password Reset Email", you confirm that you want to reset your password 
                    and agree to receive a reset email from Sustainable Acts of Kindness.
                  </p>
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
        {isSignUp && (
          <p className="mt-2 text-center text-sm text-gray-600">
            You'll need to confirm your email address before you can sign in
          </p>
        )}
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
              {isSignUp && (
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setShowPasswordReset(true);
                    setResetSent(false);
                    setResetAttempted(false);
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