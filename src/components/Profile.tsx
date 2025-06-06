import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Bell, Settings, Loader, Clock, CheckCircle, AlertCircle, UserMinus, Eye } from 'lucide-react';
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

interface EventReminder {
  id: string;
  event_id: string;
  event_name: string;
  event_date: string;
  reminder_date: string;
  is_read: boolean;
  created_at: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [participations, setParticipations] = useState<EventParticipation[]>([]);
  const [reminders, setReminders] = useState<EventReminder[]>([]);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUserEmail(user.email);

      // Fetch participations
      const { data: participationsData, error: participationsError } = await supabase
        .from('event_participants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (participationsError) throw participationsError;
      setParticipations(participationsData || []);

      // Fetch reminders
      const { data: remindersData, error: remindersError } = await supabase
        .from('event_reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: true });

      if (remindersError) throw remindersError;
      setReminders(remindersData || []);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const markReminderAsRead = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('event_reminders')
        .update({ is_read: true })
        .eq('id', reminderId);

      if (error) throw error;

      setReminders(reminders.map(r => 
        r.id === reminderId 
          ? { ...r, is_read: true }
          : r
      ));
    } catch (error) {
      console.error('Error marking reminder as read:', error);
    }
  };

  const handleLeaveEvent = async (eventId: string, eventName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Remove from event participants
      const { error: participationError } = await supabase
        .from('event_participants')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (participationError) {
        console.error('Error removing participation:', participationError);
        throw participationError;
      }

      // Remove associated reminders
      const { error: reminderError } = await supabase
        .from('event_reminders')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (reminderError) {
        console.error('Error removing reminder:', reminderError);
        throw reminderError;
      }

      toast.success(`Successfully left ${eventName}`);
      
      // Force a page refresh to ensure all state is updated
      window.location.reload();

    } catch (error) {
      console.error('Error leaving event:', error);
      toast.error('Failed to leave event');
    }
  };

  const getEventStatus = (eventDate: string) => {
    const now = new Date();
    const event = new Date(eventDate);
    const diffTime = event.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'past', text: 'Event completed', color: 'text-gray-500', icon: CheckCircle };
    } else if (diffDays === 0) {
      return { status: 'today', text: 'Today!', color: 'text-red-600', icon: AlertCircle };
    } else if (diffDays <= 3) {
      return { status: 'upcoming', text: `In ${diffDays} day${diffDays > 1 ? 's' : ''}`, color: 'text-amber-600', icon: Clock };
    } else {
      return { status: 'future', text: `In ${diffDays} days`, color: 'text-blue-600', icon: Calendar };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const upcomingReminders = reminders.filter(r => new Date(r.event_date) >= new Date());
  const pastReminders = reminders.filter(r => new Date(r.event_date) < new Date());

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="border-b border-gray-200 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">{userEmail}</p>
        </div>

        <div className="space-y-8">
          {/* Event Reminders Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Event Reminders
            </h2>
            
            {upcomingReminders.length === 0 && pastReminders.length === 0 ? (
              <div className="text-gray-600 bg-gray-50 rounded-lg p-6 text-center">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No event reminders yet.</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Join Events to Get Reminders
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Upcoming Events */}
                {upcomingReminders.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Upcoming Events</h3>
                    <div className="space-y-3">
                      {upcomingReminders.map((reminder) => {
                        const eventStatus = getEventStatus(reminder.event_date);
                        const StatusIcon = eventStatus.icon;
                        
                        return (
                          <div
                            key={reminder.id}
                            className={`border rounded-lg p-4 transition-colors ${
                              !reminder.is_read 
                                ? 'border-emerald-500 bg-emerald-50' 
                                : 'border-gray-200 hover:border-emerald-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-medium text-gray-900">{reminder.event_name}</h4>
                                  {!reminder.is_read && (
                                    <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                                      New
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(reminder.event_date).toLocaleDateString()}</span>
                                  </div>
                                  <div className={`flex items-center space-x-1 ${eventStatus.color}`}>
                                    <StatusIcon className="w-4 h-4" />
                                    <span className="font-medium">{eventStatus.text}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {!reminder.is_read && (
                                  <button
                                    onClick={() => markReminderAsRead(reminder.id)}
                                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                                  >
                                    Mark as Read
                                  </button>
                                )}
                                <button
                                  onClick={() => navigate(`/event/${encodeURIComponent(reminder.event_name)}`)}
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>View</span>
                                </button>
                                <button
                                  onClick={() => handleLeaveEvent(reminder.event_id, reminder.event_name)}
                                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
                                >
                                  <UserMinus className="w-4 h-4" />
                                  <span>Leave</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Past Events */}
                {pastReminders.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Past Events</h3>
                    <div className="space-y-3">
                      {pastReminders.slice(0, 5).map((reminder) => (
                        <div
                          key={reminder.id}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-700">{reminder.event_name}</h4>
                              <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                                <CheckCircle className="w-4 h-4" />
                                <span>Completed on {new Date(reminder.event_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Your Events Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Event Participations</h2>
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
                      <div className="flex-1">
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
                        <button
                          onClick={() => navigate(`/event/${encodeURIComponent(participation.event_id)}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleLeaveEvent(participation.event_id, participation.event_id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
                        >
                          <UserMinus className="w-4 h-4" />
                          <span>Leave</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings Section */}
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