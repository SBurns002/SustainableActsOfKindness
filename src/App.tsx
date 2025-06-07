import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MapView from './components/MapView';
import Header from './components/Header';
import EventDetails from './components/EventDetails';
import Auth from './components/Auth';
import AuthStatus from './components/AuthStatus';
import Profile from './components/Profile';
import About from './components/About';
import Resources from './components/Resources';
import Contact from './components/Contact';
import ResetPassword from './components/ResetPassword';
import MFAAPITest from './components/MFAAPITest';
import AdminDashboard from './components/AdminDashboard';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen bg-gray-50">
        <Header />
        <main className="flex-1 relative">
          <Routes>
            <Route path="/" element={<MapView />} />
            <Route path="/event/:id" element={
              <div className="h-full overflow-y-auto">
                <EventDetails />
              </div>
            } />
            <Route path="/auth" element={
              <div className="h-full overflow-y-auto">
                <Auth />
              </div>
            } />
            <Route path="/auth-status" element={
              <div className="h-full overflow-y-auto">
                <AuthStatus />
              </div>
            } />
            <Route path="/reset-password" element={
              <div className="h-full overflow-y-auto">
                <ResetPassword />
              </div>
            } />
            <Route path="/profile" element={
              <div className="h-full overflow-y-auto">
                <Profile />
              </div>
            } />
            <Route path="/about" element={
              <div className="h-full overflow-y-auto">
                <About />
              </div>
            } />
            <Route path="/resources" element={
              <div className="h-full overflow-y-auto">
                <Resources />
              </div>
            } />
            <Route path="/contact" element={
              <div className="h-full overflow-y-auto">
                <Contact />
              </div>
            } />
            {/* MFA Test route - protected by AdminRoute */}
            <Route path="/mfa-test" element={
              <AdminRoute>
                <div className="h-full overflow-y-auto">
                  <MFAAPITest />
                </div>
              </AdminRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <div className="h-full overflow-y-auto">
                  <AdminDashboard />
                </div>
              </AdminRoute>
            } />
          </Routes>
        </main>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;