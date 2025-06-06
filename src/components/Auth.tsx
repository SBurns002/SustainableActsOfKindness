import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import MFAChallenge from './MFAChallenge';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showMfaChallenge, setShowMfaChallenge] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
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