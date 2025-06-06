import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Users, MapPin, AlertCircle, ArrowLeft, LogIn, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import { cleanupData } from '../data/cleanupData';

const EventDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [isParticipating, setIsParticipating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchEventDetails = async (forceRefresh = false) => {
    try {
      setDataLoading(true);
      
      if (forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Get current user first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
      }
      
      setCurrentUser(user);
      setIsAuthenticated(!!user);
      
      // Get ALL participants for this event
      const { data: participantsData, error: participantsError } = await supabase
        .from('event_participants')
        .select('id, user_id')
        .eq('event_id', id);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        setParticipantCount(0);
      } else {
        console.log('All participants for event:', participantsData);
        setParticipantCount(participantsData?.length || 0);
      }

      // Check if current user is participating (only if logged in)
      if (user) {
        const userIsParticipating = participantsData?.some(p => p.user_id === user.id) || false;
        console.log('User participation check:', { 
          userId: user.id, 
          eventId: id, 
          isParticipating: userIsParticipating,
          allParticipants: participantsData?.map(p => p.user_id)
        });
        setIsParticipating(userIsParticipating);
      } else {
        setIsParticipating(false);
      }

    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error('Failed to load event details');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    // Find the event in the cleanupData
    const eventData = cleanupData.features.find(
      feature => feature.properties.name === decodeURIComponent(id || '')
    );
    setEvent(eventData);

    fetchEventDetails();
  }, [id]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, !!session);
      setIsAuthenticated(!!session);
      setCurrentUser(session?.user || null);
      if (session) {
        await fetchEventDetails(true);
      } else {
        setIsParticipating(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [id]);

  // Set up real-time subscription for event participants
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`event_participants_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants',
          filter: `event_id=eq.${id}`
        },
        (payload) => {
          console.log('Real-time update for event participants:', payload);
          // Refresh event details when participants change
          fetchEventDetails(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Listen for custom events from other components
  useEffect(() => {
    const handleParticipationChange = (event: any) => {
      console.log('Received participation change event:', event.detail);
      if (event.detail.eventId === id) {
        fetchEventDetails(true);
      }
    };

    window.addEventListener('eventParticipationChanged', handleParticipationChange);
    return () => {
      window.removeEventListener('eventParticipationChanged', handleParticipationChange);
    };
  }, [id]);

  const createEventReminder = async (userId: string, eventData: any) => {
    try {
      const eventDate = new Date(eventData.properties.date);
      const reminderDate = new Date(eventDate);
      reminderDate.setDate(reminderDate.getDate() - 1);

      // Use upsert to handle duplicates gracefully
      const { error } = await supabase
        .from('event_reminders')
        .upsert({
          user_id: userId,
          event_id: id,
          event_name: eventData.properties.name,
          event_date: eventDate.toISOString(),
          reminder_date: reminderDate.toISOString(),
          is_read: false
        }, {
          onConflict: 'user_id,event_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error creating/updating reminder:', error);
      } else {
        console.log('Successfully created/updated reminder for event');
      }
    } catch (error) {
      console.error('Error creating event reminder:', error);
    }
  };

  const handleJoinEvent = async () => {
    setLoading(true);
    
    if (!currentUser) {
      navigate('/auth', { state: { returnTo: `/event/${id}` } });
      setLoading(false);
      return;
    }

    try {
      // Check if already participating
      const { data: existingParticipation } = await supabase
        .from('event_participants')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('event_id', id)
        .maybeSingle();

      if (existingParticipation) {
        toast.error('You are already registered for this event');
        setLoading(false);
        return;
      }

      console.log('Attempting to join event:', { userId: currentUser.id, eventId: id });

      const { error } = await supabase
        .from('event_participants')
        .insert({
          user_id: currentUser.id,
          event_id: id,
          notification_preferences: { email: true, push: false }
        });

      if (error) {
        console.error('Error joining event:', error);
        throw error;
      }

      if (event) {
        await createEventReminder(currentUser.id, event);
      }

      // Update local state immediately
      setIsParticipating(true);
      setParticipantCount(prev => prev + 1);

      console.log('Successfully joined event, updated local state');
      toast.success('Successfully joined the event! A reminder has been set for you.');
      
      // Trigger a broadcast to other components
      window.dispatchEvent(new CustomEvent('eventParticipationChanged', { 
        detail: { eventId: id, userId: currentUser.id, action: 'joined' } 
      }));
      
    } catch (error: any) {
      console.error('Error joining event:', error);
      toast.error(`Failed to join the event: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    setLoading(true);
    
    if (!currentUser) {
      toast.error('You must be logged in to leave an event');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to leave event:', { userId: currentUser.id, eventId: id });

      // Check if user is actually participating
      const { data: currentParticipation } = await supabase
        .from('event_participants')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('event_id', id)
        .maybeSingle();

      if (!currentParticipation) {
        console.log('User is not participating in this event');
        setIsParticipating(false);
        toast.error('You are not currently registered for this event');
        setLoading(false);
        return;
      }

      // Remove from event participants
      const { error: participationError } = await supabase
        .from('event_participants')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('event_id', id);

      if (participationError) {
        console.error('Error removing participation:', participationError);
        throw new Error(`Failed to remove participation: ${participationError.message}`);
      }

      // Remove reminder for the event (this will now only remove one due to unique constraint)
      const { error: reminderError } = await supabase
        .from('event_reminders')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('event_id', id);

      if (reminderError) {
        console.error('Error removing reminder:', reminderError);
      }

      // Update local state immediately
      setIsParticipating(false);
      setParticipantCount(prev => Math.max(0, prev - 1));

      console.log('Successfully left event, updated local state');
      toast.success('Successfully left the event. Your reminder has been removed.');
      
      // Trigger a broadcast to other components
      window.dispatchEvent(new CustomEvent('eventParticipationChanged', { 
        detail: { eventId: id, userId: currentUser.id, action: 'left' } 
      }));
      
    } catch (error: any) {
      console.error('Error leaving event:', error);
      toast.error(`Failed to leave the event: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!event) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">Event not found</div>
    </div>
  );

  if (dataLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">Loading event details...</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => navigate('/')}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Map
      </button>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{event.properties.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-emerald-600 mr-3" />
                <span>{new Date(event.properties.date).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-emerald-600 mr-3" />
                <span>{event.properties.type}</span>
              </div>
              
              <div className="flex items-center">
                <Users className="w-5 h-5 text-emerald-600 mr-3" />
                <span>{participantCount} participants</span>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600">{event.properties.description}</p>
            </div>

            {!isAuthenticated && (
              <button
                onClick={() => navigate('/auth', { state: { returnTo: `/event/${id}` } })}
                className="mt-8 w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign in to join this event
              </button>
            )}

            {isAuthenticated && !isParticipating && (
              <button
                onClick={handleJoinEvent}
                disabled={loading}
                className="mt-8 w-full bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join This Event'}
              </button>
            )}

            {isAuthenticated && isParticipating && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center text-emerald-600 bg-emerald-50 p-4 rounded-lg">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>You're registered for this event!</span>
                </div>
                <button
                  onClick={handleLeaveEvent}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <UserMinus className="w-5 h-5 mr-2" />
                  {loading ? 'Leaving...' : 'Leave Event'}
                </button>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Requirements</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Wear appropriate clothing for outdoor work</li>
              <li>Bring water and snacks</li>
              <li>Sunscreen and hat recommended</li>
              <li>Tools will be provided</li>
            </ul>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Organizer</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">Environmental Protection Group</h4>
                <p className="text-gray-600 mt-2">
                  Local organization dedicated to environmental conservation and community engagement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;