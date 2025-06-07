import React, { useState, useEffect } from 'react';
import { MapPin, LogIn, UserCircle, LogOut, User, Bell, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Header: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasUpcomingEvents, setHasUpcomingEvents] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email || null);
      
      if (session?.user) {
        checkUpcomingEvents(session.user.id);
        checkAdminStatus(session.user.id);
      } else {
        setHasUpcomingEvents(false);
        setIsAdmin(false);
      }
    });

    // Get initial auth state
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Auth error:', error);
          // Clear the session for any authentication error
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setUserEmail(null);
          setHasUpcomingEvents(false);
          setIsAdmin(false);
          return;
        }
        
        setIsAuthenticated(!!user);
        setUserEmail(user?.email || null);
        
        if (user) {
          checkUpcomingEvents(user.id);
          checkAdminStatus(user.id);
        }
      } catch (error) {
        console.error('Unexpected auth error:', error);
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setUserEmail(null);
        setHasUpcomingEvents(false);
        setIsAdmin(false);
      }
    };
    checkAuth();

    return () => subscription.unsubscribe();
  }, []);

  const checkUpcomingEvents = async (userId: string) => {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(now.getDate() + 3);

      const { data: upcomingReminders } = await supabase
        .from('event_reminders')
        .select('id')
        .eq('user_id', userId)
        .gte('event_date', now.toISOString())
        .lte('event_date', threeDaysFromNow.toISOString())
        .eq('is_read', false);

      setHasUpcomingEvents((upcomingReminders?.length || 0) > 0);
    } catch (error) {
      console.error('Error checking upcoming events:', error);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .limit(1);

      setIsAdmin(roles && roles.length > 0);
    } catch (error) {
      // User is not an admin, which is fine
      setIsAdmin(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="bg-emerald-700 text-white shadow-md py-4 px-6 relative z-[9999]">
      <div className="container mx-auto flex justify-between items-center">
        {/* Title on far left */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <MapPin className="h-6 w-6" />
          <Link to="/" className="text-xl font-bold whitespace-nowrap">
            Sustainable Acts of Kindness
          </Link>
        </div>
        
        {/* Navigation and auth section */}
        <div className="flex items-center space-x-6 ml-auto">
          <nav className="hidden md:block">
            <ul className="flex space-x-6">
              <li><Link to="/" className="hover:text-emerald-200 transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-emerald-200 transition-colors">About</Link></li>
              <li><Link to="/resources" className="hover:text-emerald-200 transition-colors">Resources</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-200 transition-colors">Contact</Link></li>
            </ul>
          </nav>

          {isAuthenticated ? (
            <div className="relative group">
              <div className="flex items-center text-emerald-200 cursor-pointer">
                <div className="relative">
                  <UserCircle className="h-6 w-6" />
                  {hasUpcomingEvents && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                      <Bell className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute right-0 mt-2 min-w-64 max-w-80 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  <div className="font-medium text-gray-900 mb-1">Signed in as:</div>
                  <div className="text-gray-600 break-all text-xs leading-relaxed">
                    {userEmail}
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <User className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Profile</span>
                  {hasUpcomingEvents && (
                    <div className="ml-auto w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                  )}
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-50 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition-colors flex-shrink-0"
            >
              <LogIn className="h-5 w-5" />
              <span>Login / Sign Up</span>
            </button>
          )}
        </div>
        
        <button className="block md:hidden ml-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;