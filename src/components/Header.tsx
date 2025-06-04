import React, { useState, useEffect } from 'react';
import { MapPin, LogIn, UserCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Header: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="bg-emerald-700 text-white shadow-md py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <MapPin className="h-6 w-6" />
          <h1 className="text-xl font-bold">Environmental Cleanup Map</h1>
        </Link>
        
        <div className="flex items-center space-x-6">
          <nav className="hidden md:block">
            <ul className="flex space-x-6">
              <li><Link to="/" className="hover:text-emerald-200 transition-colors">Home</Link></li>
              <li><a href="#" className="hover:text-emerald-200 transition-colors">About</a></li>
              <li><a href="#" className="hover:text-emerald-200 transition-colors">Resources</a></li>
              <li><a href="#" className="hover:text-emerald-200 transition-colors">Contact</a></li>
            </ul>
          </nav>

          {isAuthenticated ? (
            <div className="flex items-center text-emerald-200">
              <UserCircle className="h-6 w-6" />
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