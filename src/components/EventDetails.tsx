import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { eventDataManager } from '../lib/eventDataManager';
import { Calendar, Users, MapPin, AlertCircle, ArrowLeft, LogIn, UserMinus, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

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
      
      // Get event details
      const eventName = decodeURIComponent(id || '');
      const eventData = eventDataManager.getEventByName(eventName);
      
      if (!eventData) {
        console.error('Event not found:', eventName);
        setParticipantCount(0);
        setIsParticipating(false);
        return;
      }

      // Ensure the event exists in the database and get its UUID
      let eventId = eventData.properties.id;
      if (!eventId) {
        eventId = await eventDataManager.ensureEventExists(eventData.properties.name);
        if (!eventId) {
          console.error('Failed to create event in database');
          setParticipantCount(0);
          setIsParticipating(false);
          return;
        }
        // Refresh event data to get the UUID
        await eventDataManager.refresh();
        const updatedEventData = eventDataManager.getEventByName(eventName);
        if (updatedEventData) {
          setEvent(updatedEventData);
          eventId = updatedEventData.properties.id;
        }
      }

      // Get ALL participants for this event using the UUID
      const { data: participantsData, error: participantsError } = await supabase
        .from('event_participants')
        .select('id, user_id')
        .eq('event_id', eventId);

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
          eventId: eventId, 
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
    // Find the event using the event data manager (which includes admin updates)
    const eventName = decodeURIComponent(id || '');
    const eventData = eventDataManager.getEventByName(eventName);
    setEvent(eventData);

    fetchEventDetails();

    // Listen for event data updates
    const unsubscribe = eventDataManager.addListener(() => {
      console.log('Event data updated, refreshing event details...');
      const updatedEventData = eventDataManager.getEventByName(eventName);
      setEvent(updatedEventData);
      // Also refresh participant data in case event name changed
      fetchEventDetails(true);
    });

    return unsubscribe;
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
    if (!id || !event?.properties?.id) return;

    const eventId = event.properties.id;

    const channel = supabase
      .channel(`event_participants_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants',
          filter: `event_id=eq.${eventId}`
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
  }, [id, event?.properties?.id]);

  // Listen for custom events from other components
  useEffect(() => {
    const handleParticipationChange = (event: any) => {
      console.log('Received participation change event:', event.detail);
      const eventName = decodeURIComponent(id || '');
      const eventData = eventDataManager.getEventByName(eventName);
      const eventId = eventData?.properties?.id;
      
      if (event.detail.eventId === eventId) {
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

      // Use the event UUID for database operations
      const eventId = eventData.properties.id;
      if (!eventId) {
        console.error('Event ID not found for reminder creation');
        return;
      }

      // Use upsert to handle duplicates gracefully
      const { error } = await supabase
        .from('event_reminders')
        .upsert({
          user_id: userId,
          event_id: eventId, // Use UUID instead of name
          event_name: eventData.properties.name, // Use current name for display
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
      // Get event details and ensure it exists in database
      const eventName = decodeURIComponent(id || '');
      const eventData = eventDataManager.getEventByName(eventName);
      
      if (!eventData) {
        throw new Error('Event not found');
      }

      // Ensure the event exists in the database and get its UUID
      let eventId = eventData.properties.id;
      if (!eventId) {
        eventId = await eventDataManager.ensureEventExists(eventData.properties.name);
        if (!eventId) {
          throw new Error('Failed to create event in database');
        }
      }

      // Check if already participating
      const { data: existingParticipation } = await supabase
        .from('event_participants')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('event_id', eventId)
        .maybeSingle();

      if (existingParticipation) {
        toast.error('You are already registered for this event');
        setLoading(false);
        return;
      }

      console.log('Attempting to join event:', { userId: currentUser.id, eventId: eventId });

      const { error } = await supabase
        .from('event_participants')
        .insert({
          user_id: currentUser.id,
          event_id: eventId, // Use UUID instead of name
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
        detail: { eventId: eventId, userId: currentUser.id, action: 'joined' } 
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
      // Get event details
      const eventName = decodeURIComponent(id || '');
      const eventData = eventDataManager.getEventByName(eventName);
      
      if (!eventData?.properties?.id) {
        throw new Error('Event not found or missing ID');
      }

      const eventId = eventData.properties.id;

      console.log('Attempting to leave event:', { userId: currentUser.id, eventId: eventId });

      // Check if user is actually participating
      const { data: currentParticipation } = await supabase
        .from('event_participants')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('event_id', eventId)
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
        .eq('event_id', eventId);

      if (participationError) {
        console.error('Error removing participation:', participationError);
        throw new Error(`Failed to remove participation: ${participationError.message}`);
      }

      // Remove reminder for the event
      const { error: reminderError } = await supabase
        .from('event_reminders')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('event_id', eventId);

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
        detail: { eventId: eventId, userId: currentUser.id, action: 'left' } 
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
              
              {event.properties.time && (
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-emerald-600 mr-3" />
                  <span>{event.properties.time}</span>
                </div>
              )}
              
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-emerald-600 mr-3 mt-0.5" />
                <div>
                  <div className="font-medium">{event.properties.location}</div>
                  {event.properties.address && (
                    <div className="text-sm text-gray-600">{event.properties.address}</div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center">
                <Users className="w-5 h-5 text-emerald-600 mr-3" />
                <span>
                  {participantCount} participants
                  {event.properties.max_participants && ` / ${event.properties.max_participants} max`}
                </span>
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
            {event.properties.requirements && event.properties.requirements.length > 0 ? (
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                {event.properties.requirements.map((req: string, index: number) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Wear appropriate clothing for outdoor work</li>
                <li>Bring water and snacks</li>
                <li>Sunscreen and hat recommended</li>
                <li>Tools will be provided</li>
              </ul>
            )}

            {event.properties.what_to_bring && event.properties.what_to_bring.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">What to Bring</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {event.properties.what_to_bring.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Organizer</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium">{event.properties.organizer_name || 'Environmental Protection Group'}</h4>
                {event.properties.organizer_contact && (
                  <p className="text-gray-600 mt-1">{event.properties.organizer_contact}</p>
                )}
                <p className="text-gray-600 mt-2">
                  Local organization dedicated to environmental conservation and community engagement.
                </p>
              </div>
            </div>

            {/* Event Type Specific Information */}
            {event.properties.eventType === 'treePlanting' && event.properties.trees && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Tree Planting Details</h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800">
                    <strong>Target:</strong> {event.properties.trees} trees to be planted
                  </p>
                  <p className="text-green-700 mt-2 text-sm">
                    Native species will be selected to support local ecosystem restoration.
                  </p>
                </div>
              </div>
            )}

            {event.properties.eventType === 'garden' && event.properties.plots && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Garden Details</h3>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-amber-800">
                    <strong>Available Plots:</strong> {event.properties.plots} garden plots
                  </p>
                  <p className="text-amber-700 mt-2 text-sm">
                    Community garden promoting sustainable food production and education.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;