import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Users, MapPin, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { cleanupData } from '../data/cleanupData';

const EventDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [isParticipating, setIsParticipating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Find the event in the cleanupData
    const eventData = cleanupData.features.find(
      feature => feature.properties.name === decodeURIComponent(id || '')
    );
    setEvent(eventData);

    const fetchEventDetails = async () => {
      try {
        // Get participant count
        const { data: participantsData } = await supabase
          .from('event_participants')
          .select('id')
          .eq('event_id', id);

        setParticipantCount(participantsData?.length || 0);

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsParticipating(false);
          return;
        }

        // Only check user participation if user is logged in
        const { data: userParticipation } = await supabase
          .from('event_participants')
          .select('id')
          .eq('event_id', id)
          .eq('user_id', user.id)
          .single();

        setIsParticipating(!!userParticipation);
      } catch (error) {
        console.error('Error fetching event details:', error);
        toast.error('Failed to load event details');
      }
    };

    fetchEventDetails();
  }, [id]);

  const handleJoinEvent = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { error } = await supabase
        .from('event_participants')
        .insert({
          user_id: user.id,
          event_id: id,
          notification_preferences: { email: true, push: false }
        });

      if (error) throw error;

      setIsParticipating(true);
      setParticipantCount(prev => prev + 1);
      toast.success('Successfully joined the event!');
    } catch (error) {
      toast.error('Failed to join the event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!event) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">Event not found</div>
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

            {!isParticipating && (
              <button
                onClick={handleJoinEvent}
                disabled={loading}
                className="mt-8 w-full bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join This Event'}
              </button>
            )}

            {isParticipating && (
              <div className="mt-8 flex items-center text-emerald-600">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>You're registered for this event!</span>
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