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
      console.log('Loading event updates from database...');
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading event updates:', error);
        return;
      }

      console.log('Raw events from database:', events);

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
          console.log('Loaded admin-created event:', event.title, 'with ID:', event.id, 'Status:', event.status);
        } else {
          // Store by original name for mapping to static data
          this.eventUpdates.set(originalName, eventUpdate);
          console.log('Loaded static event update:', event.title, 'mapped to:', originalName);
        }

        // Also store by current title for lookups
        this.eventsByTitle.set(event.title, eventUpdate);
        // Store by UUID for database operations
        this.eventsById.set(event.id, eventUpdate);
      });

      console.log('Event data loaded:', {
        staticUpdates: this.eventUpdates.size,
        adminCreated: this.adminCreatedEvents.size,
        totalEvents: events?.length || 0,
        adminEventTitles: Array.from(this.adminCreatedEvents.values()).map(e => e.title)
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

  // Simple coordinate generation for Boston area only
  private generateCoordinatesFromLocation(location: string): [number, number] {
    const cleanLocation = location.toLowerCase().trim();
    
    console.log('Generating coordinates for location:', location);
    
    // Simple Boston area coordinates mapping
    const locationMap: { [key: string]: [number, number] } = {
      // Boston neighborhoods
      'back bay': [42.3467, -71.0972],
      'beacon hill': [42.3588, -71.0707],
      'north end': [42.3647, -71.0542],
      'south end': [42.3467, -71.0972],
      'downtown': [42.3601, -71.0589],
      'financial district': [42.3601, -71.0589],
      'chinatown': [42.3467, -71.0972],
      'south boston': [42.3188, -71.0846],
      'east boston': [42.3188, -71.0846],
      'charlestown': [42.3875, -71.0995],
      'jamaica plain': [42.3188, -71.0846],
      'roxbury': [42.3188, -71.0846],
      'dorchester': [42.3188, -71.0846],
      'fenway': [42.3467, -71.0972],
      'boston common': [42.3550, -71.0656],
      'public garden': [42.3541, -71.0711],
      'franklin park': [42.3188, -71.0846],
      'charles river': [42.3601, -71.0589],
      
      // General Boston
      'boston': [42.3601, -71.0589],
    };

    // Try exact match first
    if (locationMap[cleanLocation]) {
      console.log(`Found exact coordinates for "${cleanLocation}":`, locationMap[cleanLocation]);
      return locationMap[cleanLocation];
    }

    // Try partial matches
    for (const [key, coords] of Object.entries(locationMap)) {
      if (cleanLocation.includes(key)) {
        console.log(`Found partial match coordinates for "${key}" in "${cleanLocation}":`, coords);
        return coords;
      }
    }
    
    // Default to Boston center
    console.log('Using default Boston coordinates for:', cleanLocation);
    return [42.3601, -71.0589];
  }

  // Convert admin-created event to GeoJSON feature
  private adminEventToGeoJSONFeature(event: EventUpdate) {
    const coordinates = event.coordinates 
      ? [event.coordinates.lng, event.coordinates.lat]
      : this.generateCoordinatesFromLocation(event.location);

    console.log('Converting admin event to GeoJSON:', {
      title: event.title,
      location: event.location,
      coordinates: coordinates,
      eventType: event.event_type,
      status: event.status
    });

    // Create a proper polygon around the coordinates
    const polygonSize = 0.008;
    const [lng, lat] = coordinates;

    const feature = {
      type: "Feature" as const,
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
        priority: 'medium',
        // Add specific properties based on event type
        ...(event.event_type === 'treePlanting' && { trees: event.max_participants || 100 }),
        ...(event.event_type === 'garden' && { plots: event.max_participants || 50 })
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [[
          [lng - polygonSize, lat + polygonSize],
          [lng + polygonSize, lat + polygonSize],
          [lng + polygonSize, lat - polygonSize],
          [lng - polygonSize, lat - polygonSize],
          [lng - polygonSize, lat + polygonSize]
        ]]
      }
    };

    console.log('Generated GeoJSON feature:', {
      name: feature.properties.name,
      coordinates: feature.geometry.coordinates[0],
      center: [lng, lat],
      hasValidCoordinates: !isNaN(lng) && !isNaN(lat)
    });

    return feature;
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

    // Add admin-created events as new features (only active ones)
    const adminFeatures = Array.from(this.adminCreatedEvents.values())
      .filter(event => {
        const isActive = event.status === 'active';
        console.log(`Checking admin event ${event.title}: status=${event.status}, active=${isActive}`);
        return isActive;
      })
      .map(event => this.adminEventToGeoJSONFeature(event));

    console.log('Admin features to add to map:', adminFeatures.length, adminFeatures.map(f => f.properties.name));

    mergedData.features = [...mergedData.features, ...adminFeatures];

    console.log('Merged event data:', {
      staticEvents: cleanupData.features.length,
      updatedEvents: this.eventUpdates.size,
      adminEvents: adminFeatures.length,
      totalFeatures: mergedData.features.length,
      allEventNames: mergedData.features.map(f => f.properties.name)
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
    console.log('Refreshing event data from database...');
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