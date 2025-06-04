import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MapView from './components/MapView';
import Header from './components/Header';
import EventDetails from './components/EventDetails';
import Auth from './components/Auth';
import AuthStatus from './components/AuthStatus';
import Profile from './components/Profile';

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen bg-gray-50">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<MapView />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth-status" element={<AuthStatus />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;