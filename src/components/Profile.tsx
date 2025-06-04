import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Bell, Settings, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface EventParticipation {
  id: string;
  event_id: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
  };
  created_at: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [participations, setParticipations] = useState<EventParticipation[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/auth');
          return;
        }

        setUserEmail(user.email);

        const { data: participationsData, error } = await supabase
          .from('event_participants')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setParticipations(participationsData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const updateNotificationPreferences = async (participationId: string, preferences: any) => {
    try {
      const { error } = await supabase
        .from('event_participants')
        .update({ notification_preferences: preferences })
        .eq('id', participationId);

      if (error) throw error;

      setParticipations(participations.map(p => 
        p.id === participationId 
          ? { ...p, notification_preferences: preferences }
          : p
      ));

      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="border-b border-gray-200 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">{userEmail}</p>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Events</h2>
            {participations.length === 0 ? (
              <div className="text-gray-600 bg-gray-50 rounded-lg p-6 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>You haven't joined any events yet.</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Browse Events
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {participations.map((participation) => (
                  <div
                    key={participation.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-emerald-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{participation.event_id}</h3>
                        <p className="text-sm text-gray-500">
                          Joined on {new Date(participation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Bell className="w-4 h-4 text-gray-400" />
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={participation.notification_preferences.email}
                              onChange={() => updateNotificationPreferences(participation.id, {
                                ...participation.notification_preferences,
                                email: !participation.notification_preferences.email
                              })}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                            <span className="ml-2 text-sm font-medium text-gray-700">Email</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">Account Preferences</span>
                </div>
                <button
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                  onClick={() => toast.success('Settings page coming soon!')}
                >
                  Manage
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;