import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Bell, Settings, Loader, Clock, CheckCircle, AlertCircle, UserMinus, Eye, Plus, Shield, Smartphone, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { cleanupData } from '../data/cleanupData';
import MFASetup from './MFASetup';
import MFADisable from './MFADisable';

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

interface MFAFactor {
  id: string;
  type: string;
  status: string;
  created_at: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [participations, setParticipations] = useState<EventParticipation[]>([]);
  const [reminders, setReminders] = useState<EventReminder[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [creatingReminders, setCreatingReminders] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<MFAFactor[]>([]);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [showMfaDisable, setShowMfaDisable] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const getEventDetails = (eventId: string) => {
    return cleanupData.features.find(
      feature => feature.properties.name === eventId
    );
  };

  const getDaysUntilEvent = (eventDate: string) => {
    const now = new Date();
    const event = new Date(eventDate);
    const diffTime = event.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const fetchMfaFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error('Error fetching MFA factors:', error);
        return;
      }

      setMfaFactors(data?.totp || []);
    } catch (error) {
      console.error('Error fetching MFA factors:', error);
    }
  };

  const createMissingReminders = async () => {
    if (!currentUser || participations.length === 0) return;

    setCreatingReminders(true);
    let remindersCreated = 0;

    try {
      for (const participation of participations) {
        // Check if reminder already exists
        const existingReminder = reminders.find(r => r.event_id === participation.event_id);
        if (existingReminder) continue;

        // Get event details
        const eventDetails = getEventDetails(participation.event_id);
        if (!eventDetails) continue;

        const eventDate = new Date(eventDetails.properties.date);
        const reminderDate = new Date(eventDate);
        reminderDate.setDate(reminderDate.getDate() - 1); // Remind 1 day before

        // Only create reminder for future events
        if (eventDate > new Date()) {
          // Use upsert to handle potential duplicates gracefully
          const { error } = await supabase
            .from('event_reminders')
            .upsert({
              user_id: currentUser.id,
              event_id: participation.event_id,
              event_name: eventDetails.properties.name,
              event_date: eventDate.toISOString(),
              reminder_date: reminderDate.toISOString(),
              is_read: false
            }, {
              onConflict: 'user_id,event_id',
              ignoreDuplicates: false
            });

          if (error) {
            console.error('Error creating reminder:', error);
          } else {
            remindersCreated++;
          }
        }
      }

      if (remindersCreated > 0) {
        toast.success(`Created ${remindersCreated} event reminder${remindersCreated > 1 ? 's' : ''}!`);
        await fetchUserData(true);
      } else if (participations.length > 0) {
        toast.info('All your events already have reminders set up!');
      }
    } catch (error) {
      console.error('Error creating reminders:', error);
      toast.error('Failed to create some reminders');
    } finally {
      setCreatingReminders(false);
    }
  };

  const fetchUserData = async (forceRefresh = false) => {
    try {
      console.log('Fetching user data, forceRefresh:', forceRefresh);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        navigate('/auth');
        return;
      }
      
      if (!user) {
        console.log('No user found, redirecting to auth');
        navigate('/auth');
        return;
      }

      console.log('User found:', user.id);
      setCurrentUser(user);
      setUserEmail(user.email);

      if (forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Fetch participations with explicit user filter
      console.log('Fetching participations for user:', user.id);
      const { data: participationsData, error: participationsError } = await supabase
        .from('event_participants')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (participationsError) {
        console.error('Error fetching participations:', participationsError);
        setParticipations([]);
      } else {
        console.log('Fetched participations:', participationsData?.length || 0);
        setParticipations(participationsData || []);
      }

      // Fetch reminders with explicit user filter
      console.log('Fetching reminders for user:', user.id);
      const { data: remindersData, error: remindersError } = await supabase
        .from('event_reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: true });

      if (remindersError) {
        console.error('Error fetching reminders:', remindersError);
        setReminders([]);
      } else {
        console.log('Fetched reminders:', remindersData?.length || 0);
        setReminders(remindersData || []);
      }

      // Fetch MFA factors
      await fetchMfaFactors();

      console.log('User data fetch completed successfully');

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };

  // Initial data fetch - only run once on mount
  useEffect(() => {
    console.log('Profile component mounted, fetching initial data');
    fetchUserData();
  }, []); // Empty dependency array - only run once

  // Listen for auth state changes and refresh data
  useEffect(() => {
    console.log('Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, !!session);
      
      // Only handle auth changes after initial load is complete
      if (!initialLoadComplete) {
        console.log('Skipping auth state change - initial load not complete');
        return;
      }
      
      if (session) {
        setCurrentUser(session.user);
        // Only refresh data if we have a different user
        if (!currentUser || currentUser.id !== session.user.id) {
          await fetchUserData(true);
        }
      } else {
        setCurrentUser(null);
        setParticipations([]);
        setReminders([]);
        setMfaFactors([]);
        navigate('/auth');
      }
    });

    return () => {
      console.log('Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, [initialLoadComplete, currentUser, navigate]);

  // Listen for custom events from other components
  useEffect(() => {
    const handleParticipationChange = (event: any) => {
      console.log('Received participation change event:', event.detail);
      if (currentUser && event.detail.userId === currentUser.id && initialLoadComplete) {
        fetchUserData(true);
      }
    };

    window.addEventListener('eventParticipationChanged', handleParticipationChange);
    return () => {
      window.removeEventListener('eventParticipationChanged', handleParticipationChange);
    };
  }, [currentUser, initialLoadComplete]);

  // Set up real-time subscription with better error handling
  useEffect(() => {
    if (!currentUser || !initialLoadComplete) return;

    console.log('Setting up real-time subscriptions for user:', currentUser.id);
    let participationsChannel: any = null;
    let remindersChannel: any = null;

    try {
      participationsChannel = supabase
        .channel(`user_participations_${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_participants',
            filter: `user_id=eq.${currentUser.id}`
          },
          (payload) => {
            console.log('Real-time update for user participations:', payload);
            fetchUserData(true);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to participations channel');
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('Error subscribing to participations channel, continuing without real-time updates');
          }
        });

      remindersChannel = supabase
        .channel(`user_reminders_${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_reminders',
            filter: `user_id=eq.${currentUser.id}`
          },
          (payload) => {
            console.log('Real-time update for user reminders:', payload);
            fetchUserData(true);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to reminders channel');
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('Error subscribing to reminders channel, continuing without real-time updates');
          }
        });
    } catch (error) {
      console.warn('Real-time subscription failed, continuing without real-time updates:', error);
    }

    return () => {
      try {
        console.log('Cleaning up real-time subscriptions');
        if (participationsChannel) {
          supabase.removeChannel(participationsChannel);
        }
        if (remindersChannel) {
          supabase.removeChannel(remindersChannel);
        }
      } catch (error) {
        console.warn('Error cleaning up real-time subscriptions:', error);
      }
    };
  }, [currentUser, initialLoadComplete]);

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
      if (!currentUser) {
        toast.error('You must be logged in to leave an event');
        return;
      }

      console.log('Attempting to leave event from profile:', { userId: currentUser.id, eventId });

      // Check if user is actually participating
      const { data: currentParticipation } = await supabase
        .from('event_participants')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('event_id', eventId)
        .maybeSingle();

      if (!currentParticipation) {
        console.log('User is not participating in this event');
        // Remove from local state anyway to keep UI consistent
        setParticipations(prev => prev.filter(p => p.event_id !== eventId));
        setReminders(prev => prev.filter(r => r.event_id !== eventId));
        toast.error('You are not currently registered for this event');
        return;
      }

      // Remove from event participants
      const { error: participationError } = await supabase
        .from('event_participants')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('event_id', eventId);

      if (participationError) {
        console.error('Error removing participation:', participationError);
        throw new Error(`Failed to remove participation: ${participationError.message}`);
      }

      // Remove associated reminders (now only one will exist due to unique constraint)
      const { error: reminderError } = await supabase
        .from('event_reminders')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('event_id', eventId);

      if (reminderError) {
        console.error('Error removing reminder:', reminderError);
      }

      // Update local state immediately
      setParticipations(prev => prev.filter(p => p.event_id !== eventId));
      setReminders(prev => prev.filter(r => r.event_id !== eventId));

      console.log('Successfully left event from profile, updated local state');
      toast.success(`Successfully left ${eventName}`);

      // Trigger a broadcast to other components
      window.dispatchEvent(new CustomEvent('eventParticipationChanged', { 
        detail: { eventId, userId: currentUser.id, action: 'left' } 
      }));

    } catch (error: any) {
      console.error('Error leaving event:', error);
      toast.error(`Failed to leave event: ${error.message}`);
    }
  };

  const getEventStatus = (eventDate: string) => {
    const daysUntil = getDaysUntilEvent(eventDate);

    if (daysUntil < 0) {
      return { 
        status: 'past', 
        text: 'Event completed', 
        color: 'text-gray-500', 
        bgColor: 'bg-gray-100',
        icon: CheckCircle,
        days: Math.abs(daysUntil)
      };
    } else if (daysUntil === 0) {
      return { 
        status: 'today', 
        text: 'Today!', 
        color: 'text-red-600', 
        bgColor: 'bg-red-100',
        icon: AlertCircle,
        days: 0
      };
    } else if (daysUntil <= 3) {
      return { 
        status: 'upcoming', 
        text: `${daysUntil} day${daysUntil > 1 ? 's' : ''} left`, 
        color: 'text-amber-600', 
        bgColor: 'bg-amber-100',
        icon: Clock,
        days: daysUntil
      };
    } else {
      return { 
        status: 'future', 
        text: `${daysUntil} days left`, 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-100',
        icon: Calendar,
        days: daysUntil
      };
    }
  };

  const handleMfaSetupComplete = () => {
    setShowMfaSetup(false);
    fetchMfaFactors();
  };

  const handleMfaDisableComplete = () => {
    setShowMfaDisable(false);
    fetchMfaFactors();
  };

  const isMfaEnabled = mfaFactors.some(factor => factor.status === 'verified');
  const verifiedTotpFactor = mfaFactors.find(factor => factor.status === 'verified');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your profile</p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const upcomingReminders = reminders.filter(r => new Date(r.event_date) >= new Date());
  const pastReminders = reminders.filter(r => new Date(r.event_date) < new Date());

  // Check for participations without reminders
  const participationsWithoutReminders = participations.filter(p => {
    const hasReminder = reminders.some(r => r.event_id === p.event_id);
    const eventDetails = getEventDetails(p.event_id);
    const isFutureEvent = eventDetails && new Date(eventDetails.properties.date) > new Date();
    return !hasReminder && isFutureEvent;
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="border-b border-gray-200 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">{userEmail}</p>
        </div>

        <div className="space-y-8">
          {/* Security Settings Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security Settings
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Multi-Factor Authentication</h3>
                  <p className="text-gray-600 mb-4">
                    Add an extra layer of security to your account with MFA
                  </p>
                  
                  {isMfaEnabled && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <Smartphone className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Authenticator App</h4>
                            <p className="text-sm text-gray-600">
                              Added on {new Date(mfaFactors[0]?.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                            Enabled
                          </span>
                          <button
                            onClick={() => setShowMfaDisable(true)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Disable
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {!isMfaEnabled && (
                  <button
                    onClick={() => setShowMfaSetup(true)}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Enable MFA
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Event Reminders Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Event Reminders
              </h2>
              {participationsWithoutReminders.length > 0 && (
                <button
                  onClick={createMissingReminders}
                  disabled={creatingReminders}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {creatingReminders 
                      ? 'Creating...' 
                      : `Create ${participationsWithoutReminders.length} Reminder${participationsWithoutReminders.length > 1 ? 's' : ''}`
                    }
                  </span>
                </button>
              )}
            </div>
            
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
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(reminder.event_date).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${eventStatus.color} ${eventStatus.bgColor}`}>
                                  <StatusIcon className="w-4 h-4" />
                                  <span>{eventStatus.text}</span>
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
                {participations.map((participation) => {
                  const eventDetails = getEventDetails(participation.event_id);
                  const eventStatus = eventDetails ? getEventStatus(eventDetails.properties.date) : null;
                  const StatusIcon = eventStatus?.icon || Calendar;
                  
                  return (
                    <div
                      key={participation.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-emerald-500 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{participation.event_id}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>Joined on {new Date(participation.created_at).toLocaleDateString()}</span>
                            {eventDetails && (
                              <span>Event: {new Date(eventDetails.properties.date).toLocaleDateString()}</span>
                            )}
                          </div>
                          {eventStatus && (
                            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium mt-2 ${eventStatus.color} ${eventStatus.bgColor}`}>
                              <StatusIcon className="w-4 h-4" />
                              <span>{eventStatus.text}</span>
                            </div>
                          )}
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
                  );
                })}
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

      {/* MFA Setup Modal */}
      {showMfaSetup && (
        <MFASetup
          onComplete={handleMfaSetupComplete}
          onCancel={() => setShowMfaSetup(false)}
        />
      )}

      {/* MFA Disable Modal */}
      {showMfaDisable && verifiedTotpFactor && (
        <MFADisable
          onSuccess={handleMfaDisableComplete}
          onCancel={() => setShowMfaDisable(false)}
          totpFactorId={verifiedTotpFactor.id}
        />
      )}
    </div>
  );
};

export default Profile;