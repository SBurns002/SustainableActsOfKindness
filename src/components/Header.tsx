import React from 'react';
import { MapPin } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-emerald-700 text-white shadow-md py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <MapPin className="h-6 w-6" />
          <h1 className="text-xl font-bold">Environmental Cleanup Map</h1>
        </div>
        
        <div className="hidden md:block">
          <nav>
            <ul className="flex space-x-6">
              <li><a href="#" className="hover:text-emerald-200 transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-emerald-200 transition-colors">About</a></li>
              <li><a href="#" className="hover:text-emerald-200 transition-colors">Resources</a></li>
              <li><a href="#" className="hover:text-emerald-200 transition-colors">Contact</a></li>
            </ul>
          </nav>
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