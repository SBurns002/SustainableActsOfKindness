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

  const fetchEventDetails = async (forceRefresh = false) => {
    try {
      setDataLoading(true);
      
      // Get participant count with a small delay to ensure database consistency
      if (forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const { data: participantsData, error: participantsError } = await supabase
        .from('event_participants')
        .select('id, user_id')
        .eq('event_id', id);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
      } else {
        console.log('Current participants:', participantsData);
        setParticipantCount(participantsData?.length || 0);
      }

      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
      }
      
      setIsAuthenticated(!!user);
      
      if (!user) {
        setIsParticipating(false);
        return;
      }

      // Check user participation with explicit query
      const { data: userParticipation, error: participationError } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (participationError) {
        console.error('Error checking participation:', participationError);
      } else {
        console.log('User participation status:', { 
          userId: user.id, 
          eventId: id, 
          isParticipating: !!userParticipation,
          participationData: userParticipation 
        });
        setIsParticipating(!!userParticipation);
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
      if (session) {
        // Refresh event details when user logs in
        await fetchEventDetails(true);
      } else {
        setIsParticipating(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [id]);

  const ensureUserExists = async (authUser: any) => {
    try {
      // Check if user exists in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!existingUser) {
        // Create user in our users table
        const { error } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error creating user:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error ensuring user exists:', error);
      throw error;
    }
  };

  const createEventReminder = async (userId: string, eventData: any) => {
    try {
      const eventDate = new Date(eventData.properties.date);
      const reminderDate = new Date(eventDate);
      reminderDate.setDate(reminderDate.getDate() - 1); // Remind 1 day before

      const { error } = await supabase
        .from('event_reminders')
        .insert({
          user_id: userId,
          event_id: id,
          event_name: eventData.properties.name,
          event_date: eventDate.toISOString(),
          reminder_date: reminderDate.toISOString(),
          is_read: false
        });

      if (error) {
        console.error('Error creating reminder:', error);
        // Don't throw error here as it shouldn't prevent event registration
      }
    } catch (error) {
      console.error('Error creating event reminder:', error);
    }
  };

  const handleJoinEvent = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate('/auth', { state: { returnTo: `/event/${id}` } });
      return;
    }

    try {
      // Ensure user exists in our users table
      await ensureUserExists(user);

      const { error } = await supabase
        .from('event_participants')
        .insert({
          user_id: user.id,
          event_id: id,
          notification_preferences: { email: true, push: false }
        });

      if (error) throw error;

      // Create reminder for the event
      if (event) {
        await createEventReminder(user.id, event);
      }

      // Update local state immediately
      setIsParticipating(true);
      setParticipantCount(prev => prev + 1);

      toast.success('Successfully joined the event! A reminder has been set for you.');
    } catch (error: any) {
      console.error('Error joining event:', error);
      toast.error(`Failed to join the event: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be logged in to leave an event');
        setLoading(false);
        return;
      }

      console.log('Attempting to leave event:', { userId: user.id, eventId: id });

      // First, check if user is actually participating
      const { data: currentParticipation } = await supabase
        .from('event_participants')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', id)
        .maybeSingle();

      if (!currentParticipation) {
        toast.error('You are not currently registered for this event');
        setLoading(false);
        return;
      }

      // Remove from event participants
      const { error: participationError } = await supabase
        .from('event_participants')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', id);

      if (participationError) {
        console.error('Error removing participation:', participationError);
        throw new Error(`Failed to remove participation: ${participationError.message}`);
      }

      // Remove reminder for the event
      const { error: reminderError } = await supabase
        .from('event_reminders')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', id);

      if (reminderError) {
        console.error('Error removing reminder:', reminderError);
        // Don't throw here as participation was already removed
      }

      // Update local state immediately
      setIsParticipating(false);
      setParticipantCount(prev => Math.max(0, prev - 1));

      console.log('Successfully left event, updated local state');
      toast.success('Successfully left the event. Your reminder has been removed.');
      
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