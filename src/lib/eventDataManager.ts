import { supabase } from './supabase';
import { cleanupData } from '../data/cleanupData';

interface EventUpdate {
  id: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  max_participants?: number;
  current_participants?: number;
  requirements?: string[];
  what_to_bring?: string[];
  organizer_name: string;
  organizer_contact?: string;
  status: string;
  created_by: string;
  updated_at: string;
  original_name?: string; // Track the original name for mapping
}

class EventDataManager {
  private static instance: EventDataManager;
  private eventUpdates: Map<string, EventUpdate> = new Map(); // Key by original name
  private eventsByTitle: Map<string, EventUpdate> = new Map(); // Key by current title
  private eventsById: Map<string, EventUpdate> = new Map(); // Key by UUID
  private adminCreatedEvents: Map<string, EventUpdate> = new Map(); // Key by UUID for admin-created events
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.loadEventUpdates();
  }

  static getInstance(): EventDataManager {
    if (!EventDataManager.instance) {
      EventDataManager.instance = new EventDataManager();
    }
    return EventDataManager.instance;
  }

  // Load event updates from the database
  private async loadEventUpdates() {
    try {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading event updates:', error);
        return;
      }

      // Clear existing maps
      this.eventUpdates.clear();
      this.eventsByTitle.clear();
      this.eventsById.clear();
      this.adminCreatedEvents.clear();

      // Store updates in memory for quick access
      events?.forEach(event => {
        // Find the original event in static data to get the original name
        const originalEvent = cleanupData.features.find(feature => 
          feature.properties.name === event.title || 
          // Also check if any static event matches this event's location and type
          (feature.properties.location === event.location && 
           feature.properties.eventType === event.event_type)
        );

        const originalName = originalEvent?.properties.name || event.title;
        const isAdminCreated = !originalEvent; // If no matching static event, it's admin-created

        const eventUpdate: EventUpdate = {
          id: event.id,
          title: event.title,
          description: event.description,
          event_type: event.event_type,
          event_date: event.event_date,
          start_time: event.start_time,
          end_time: event.end_time,
          location: event.location,
          address: event.address,
          coordinates: event.coordinates,
          max_participants: event.max_participants,
          current_participants: event.current_participants || 0,
          requirements: event.requirements,
          what_to_bring: event.what_to_bring,
          organizer_name: event.organizer_name,
          organizer_contact: event.organizer_contact,
          status: event.status,
          created_by: event.created_by,
          updated_at: event.updated_at,
          original_name: originalName
        };

        if (isAdminCreated) {
          // Store admin-created events separately
          this.adminCreatedEvents.set(event.id, eventUpdate);
          console.log('Loaded admin-created event:', event.title);
        } else {
          // Store by original name for mapping to static data
          this.eventUpdates.set(originalName, eventUpdate);
        }

        // Also store by current title for lookups
        this.eventsByTitle.set(event.title, eventUpdate);
        // Store by UUID for database operations
        this.eventsById.set(event.id, eventUpdate);
      });

      console.log('Event data loaded:', {
        staticUpdates: this.eventUpdates.size,
        adminCreated: this.adminCreatedEvents.size,
        totalEvents: events?.length || 0
      });

      this.notifyListeners();
    } catch (error) {
      console.error('Error loading event updates:', error);
    }
  }

  // Create an event in the database if it doesn't exist
  async ensureEventExists(eventName: string): Promise<string | null> {
    try {
      // First check if event already exists in database
      const { data: existingEvent } = await supabase
        .from('events')
        .select('id')
        .eq('title', eventName)
        .maybeSingle();

      if (existingEvent) {
        return existingEvent.id;
      }

      // Find the event in static data
      const staticEvent = cleanupData.features.find(feature => 
        feature.properties.name === eventName
      );

      if (!staticEvent) {
        console.error('Event not found in static data:', eventName);
        return null;
      }

      // Get current user for created_by field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return null;
      }

      // Create the event in the database
      const { data: newEvent, error } = await supabase
        .from('events')
        .insert({
          title: staticEvent.properties.name,
          description: staticEvent.properties.description,
          event_type: staticEvent.properties.eventType,
          event_date: staticEvent.properties.date,
          start_time: staticEvent.properties.time?.split(' - ')[0],
          end_time: staticEvent.properties.time?.split(' - ')[1],
          location: staticEvent.properties.location,
          address: staticEvent.properties.address,
          max_participants: staticEvent.properties.max_participants,
          requirements: staticEvent.properties.requirements,
          what_to_bring: staticEvent.properties.what_to_bring,
          organizer_name: staticEvent.properties.organizer_name || 'Environmental Protection Group',
          organizer_contact: staticEvent.properties.organizer_contact,
          status: 'active',
          created_by: user.id
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating event:', error);
        return null;
      }

      // Refresh our cache
      await this.loadEventUpdates();

      return newEvent.id;
    } catch (error) {
      console.error('Error ensuring event exists:', error);
      return null;
    }
  }

  // Generate default coordinates for admin-created events based on location
  private generateCoordinatesFromLocation(location: string): [number, number] {
    const cleanLocation = location.toLowerCase();
    
    // Default coordinates for common Massachusetts areas
    if (cleanLocation.includes('boston')) return [42.3601, -71.0589];
    if (cleanLocation.includes('cambridge')) return [42.3736, -71.1097];
    if (cleanLocation.includes('salem')) return [42.5195, -70.8967];
    if (cleanLocation.includes('somerville')) return [42.3875, -71.0995];
    if (cleanLocation.includes('quincy')) return [42.2529, -71.0023];
    if (cleanLocation.includes('newton')) return [42.3370, -71.2092];
    if (cleanLocation.includes('brookline')) return [42.3318, -71.1211];
    if (cleanLocation.includes('medford')) return [42.4184, -71.1061];
    if (cleanLocation.includes('malden')) return [42.4251, -71.0662];
    if (cleanLocation.includes('lynn')) return [42.4668, -70.9495];
    if (cleanLocation.includes('lowell')) return [42.6334, -71.3162];
    if (cleanLocation.includes('brockton')) return [42.0834, -71.0184];
    if (cleanLocation.includes('fall river')) return [41.7015, -71.1550];
    if (cleanLocation.includes('lawrence')) return [42.7070, -71.1631];
    if (cleanLocation.includes('waltham')) return [42.3765, -71.2356];
    if (cleanLocation.includes('framingham')) return [42.2793, -71.4162];
    if (cleanLocation.includes('haverhill')) return [42.7762, -71.0773];
    if (cleanLocation.includes('peabody')) return [42.5278, -70.9286];
    if (cleanLocation.includes('revere')) return [42.4085, -71.0119];
    if (cleanLocation.includes('taunton')) return [41.9001, -71.0897];
    if (cleanLocation.includes('chicopee')) return [42.1487, -72.6078];
    if (cleanLocation.includes('weymouth')) return [42.2180, -70.9395];
    if (cleanLocation.includes('methuen')) return [42.7262, -71.1909];
    if (cleanLocation.includes('barnstable')) return [41.7003, -70.3002];
    if (cleanLocation.includes('pittsfield')) return [42.4501, -73.2453];
    if (cleanLocation.includes('springfield')) return [42.1015, -72.5898];
    if (cleanLocation.includes('holyoke')) return [42.2043, -72.6162];
    if (cleanLocation.includes('worcester')) return [42.2626, -71.8023];
    if (cleanLocation.includes('attleboro')) return [41.9465, -71.2928];
    if (cleanLocation.includes('concord')) return [42.4604, -71.3489];
    if (cleanLocation.includes('lexington')) return [42.4430, -71.2289];
    if (cleanLocation.includes('wellesley')) return [42.2968, -71.2962];
    if (cleanLocation.includes('needham')) return [42.2835, -71.2356];
    if (cleanLocation.includes('arlington')) return [42.4153, -71.1564];
    if (cleanLocation.includes('belmont')) return [42.3959, -71.1786];
    if (cleanLocation.includes('watertown')) return [42.3709, -71.1828];
    if (cleanLocation.includes('natick')) return [42.2834, -71.3495];
    if (cleanLocation.includes('dedham')) return [42.2418, -71.1661];
    if (cleanLocation.includes('milton')) return [42.2496, -71.0662];
    if (cleanLocation.includes('braintree')) return [42.2057, -70.9999];
    if (cleanLocation.includes('randolph')) return [42.1626, -71.0411];
    if (cleanLocation.includes('stoughton')) return [42.1251, -71.1023];
    if (cleanLocation.includes('canton')) return [42.1584, -71.1448];
    if (cleanLocation.includes('westwood')) return [42.2126, -71.2245];
    if (cleanLocation.includes('norwood')) return [42.1945, -71.1995];
    if (cleanLocation.includes('walpole')) return [42.1417, -71.2495];
    if (cleanLocation.includes('medfield')) return [42.1876, -71.3062];
    if (cleanLocation.includes('millis')) return [42.1626, -71.3578];
    if (cleanLocation.includes('franklin')) return [42.0834, -71.3967];
    if (cleanLocation.includes('foxborough')) return [42.0654, -71.2478];
    if (cleanLocation.includes('mansfield')) return [42.0334, -71.2189];
    if (cleanLocation.includes('norton')) return [41.9667, -71.1870];
    if (cleanLocation.includes('easton')) return [42.0251, -71.1286];
    if (cleanLocation.includes('sharon')) return [42.1084, -71.1786];
    if (cleanLocation.includes('carver')) return [41.8834, -70.7648];
    
    // Default to Boston if no match
    return [42.3601, -71.0589];
  }

  // Convert admin-created event to GeoJSON feature
  private adminEventToGeoJSONFeature(event: EventUpdate) {
    const coordinates = event.coordinates 
      ? [event.coordinates.lng, event.coordinates.lat]
      : this.generateCoordinatesFromLocation(event.location);

    return {
      type: "Feature",
      properties: {
        id: event.id,
        name: event.title,
        description: event.description,
        type: this.getEventTypeLabel(event.event_type),
        eventType: event.event_type,
        date: event.event_date,
        time: event.start_time && event.end_time 
          ? `${event.start_time} - ${event.end_time}`
          : event.start_time || 'Time TBD',
        location: event.location,
        address: event.address || event.location,
        organizer_name: event.organizer_name,
        organizer_contact: event.organizer_contact,
        status: event.status,
        requirements: event.requirements,
        what_to_bring: event.what_to_bring,
        max_participants: event.max_participants,
        current_participants: event.current_participants || 0,
        updated_at: event.updated_at,
        priority: 'medium', // Default priority for admin events
        // Add specific properties based on event type
        ...(event.event_type === 'treePlanting' && { trees: event.max_participants || 100 }),
        ...(event.event_type === 'garden' && { plots: event.max_participants || 50 })
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [coordinates[0] - 0.01, coordinates[1] + 0.01],
          [coordinates[0] + 0.01, coordinates[1] + 0.01],
          [coordinates[0] + 0.01, coordinates[1] - 0.01],
          [coordinates[0] - 0.01, coordinates[1] - 0.01],
          [coordinates[0] - 0.01, coordinates[1] + 0.01]
        ]]
      }
    };
  }

  // Get merged event data (static + updates + admin-created)
  getMergedEventData() {
    const mergedData = { ...cleanupData };
    
    // Start with static events and apply updates
    mergedData.features = cleanupData.features.map(feature => {
      const originalName = feature.properties.name;
      const update = this.eventUpdates.get(originalName);
      
      if (update) {
        // Merge the update with the original feature
        return {
          ...feature,
          properties: {
            ...feature.properties,
            id: update.id, // Include the database UUID
            name: update.title, // Use updated title
            description: update.description,
            type: this.getEventTypeLabel(update.event_type),
            eventType: update.event_type,
            date: update.event_date,
            time: update.start_time && update.end_time 
              ? `${update.start_time} - ${update.end_time}`
              : update.start_time || feature.properties.time,
            location: update.location,
            address: update.address || feature.properties.address,
            organizer_name: update.organizer_name,
            organizer_contact: update.organizer_contact,
            status: update.status,
            requirements: update.requirements,
            what_to_bring: update.what_to_bring,
            max_participants: update.max_participants,
            current_participants: update.current_participants || 0,
            updated_at: update.updated_at,
            original_name: originalName // Keep track of original name
          }
        };
      }
      
      return feature;
    });

    // Add admin-created events as new features
    const adminFeatures = Array.from(this.adminCreatedEvents.values())
      .filter(event => event.status === 'active') // Only show active events
      .map(event => this.adminEventToGeoJSONFeature(event));

    mergedData.features = [...mergedData.features, ...adminFeatures];

    console.log('Merged event data:', {
      staticEvents: cleanupData.features.length,
      updatedEvents: this.eventUpdates.size,
      adminEvents: adminFeatures.length,
      totalFeatures: mergedData.features.length
    });

    return mergedData;
  }

  // Get a specific event by name (checks both current title and original name)
  getEventByName(eventName: string) {
    const mergedData = this.getMergedEventData();
    return mergedData.features.find(feature => 
      feature.properties.name === eventName || 
      feature.properties.original_name === eventName
    );
  }

  // Get event by UUID
  getEventById(eventId: string) {
    return this.eventsById.get(eventId);
  }

  // Get event by current title
  getEventByTitle(title: string) {
    return this.eventsByTitle.get(title);
  }

  // Update an event (called from admin dashboard)
  async updateEvent(eventId: string, eventData: any) {
    try {
      // First, get the existing event to preserve the created_by field
      const { data: existingEvent, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (fetchError) {
        console.error('Error fetching existing event:', fetchError);
        throw fetchError;
      }

      if (!existingEvent?.created_by) {
        throw new Error('Cannot update event: original created_by field is missing');
      }

      // Update the event while preserving the created_by field
      const { data, error } = await supabase
        .from('events')
        .update({
          ...eventData,
          created_by: existingEvent.created_by, // Preserve the original creator
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      // Refresh our cache to pick up the changes
      await this.loadEventUpdates();

      return data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  // Add a listener for event updates
  addListener(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  private notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  // Helper method to get event type label
  private getEventTypeLabel(eventType: string): string {
    switch (eventType) {
      case 'cleanup': return 'Environmental Cleanup';
      case 'treePlanting': return 'Tree Planting';
      case 'garden': return 'Community Garden';
      case 'education': return 'Education';
      case 'workshop': return 'Workshop';
      default: return eventType;
    }
  }

  // Refresh data from database
  async refresh() {
    await this.loadEventUpdates();
  }

  // Get all events (useful for debugging)
  getAllEvents() {
    return {
      byOriginalName: Array.from(this.eventUpdates.entries()),
      byCurrentTitle: Array.from(this.eventsByTitle.entries()),
      byId: Array.from(this.eventsById.entries()),
      adminCreated: Array.from(this.adminCreatedEvents.entries())
    };
  }
}

export const eventDataManager = EventDataManager.getInstance();