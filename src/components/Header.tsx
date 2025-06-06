import React, { useState, useEffect } from 'react';
import { MapPin, LogIn, UserCircle, LogOut, User, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Header: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasUpcomingEvents, setHasUpcomingEvents] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email || null);
      
      if (session?.user) {
        checkUpcomingEvents(session.user.id);
      } else {
        setHasUpcomingEvents(false);
      }
    });

    // Get initial auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setUserEmail(user?.email || null);
      
      if (user) {
        checkUpcomingEvents(user.id);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="bg-emerald-700 text-white shadow-md py-4 px-6 relative z-[9999]">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <MapPin className="h-6 w-6" />
          <h1 className="text-xl font-bold text-center">Sustainable Acts of Kindness</h1>
        </Link>
        
        <div className="flex items-center space-x-6">
          <nav className="hidden md:block">
            <ul className="flex space-x-6">
              <li><Link to="/" className="hover:text-emerald-200 transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-emerald-200 transition-colors">About</Link></li>
              <li><a href="#" className="hover:text-emerald-200 transition-colors">Resources</a></li>
              <li><a href="#" className="hover:text-emerald-200 transition-colors">Contact</a></li>
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
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  {userEmail}
                </div>
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                  {hasUpcomingEvents && (
                    <div className="ml-auto w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-50 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition-colors"
            >
              <LogIn className="h-5 w-5" />
              <span>Login / Sign Up</span>
            </button>
          )}
        </div>
        
        <button className="block md:hidden">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;