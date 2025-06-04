import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthStatus: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };

    checkAuth();
  }, []);

  if (isLoggedIn === null) {
    return <div>Checking authentication status...</div>;
  }

  return (
    <div>
      You are currently {isLoggedIn ? 'logged in' : 'not logged in'}.
    </div>
  );
};

export default AuthStatus;