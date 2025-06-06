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
  max_participants?: number;
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
          max_participants: event.max_participants,
          requirements: event.requirements,
          what_to_bring: event.what_to_bring,
          organizer_name: event.organizer_name,
          organizer_contact: event.organizer_contact,
          status: event.status,
          created_by: event.created_by,
          updated_at: event.updated_at,
          original_name: originalName
        };

        // Store by original name for mapping to static data
        this.eventUpdates.set(originalName, eventUpdate);
        // Also store by current title for lookups
        this.eventsByTitle.set(event.title, eventUpdate);
        // Store by UUID for database operations
        this.eventsById.set(event.id, eventUpdate);
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

  // Get merged event data (static + updates)
  getMergedEventData() {
    const mergedData = { ...cleanupData };
    
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
            updated_at: update.updated_at,
            original_name: originalName // Keep track of original name
          }
        };
      }
      
      return feature;
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

      // Find the original name for this event
      const originalEvent = cleanupData.features.find(feature => 
        feature.properties.name === existingEvent.title ||
        (feature.properties.location === existingEvent.location && 
         feature.properties.eventType === existingEvent.event_type)
      );

      const originalName = originalEvent?.properties.name || existingEvent.title;

      // Update local cache
      const eventUpdate: EventUpdate = {
        id: data.id,
        title: data.title,
        description: data.description,
        event_type: data.event_type,
        event_date: data.event_date,
        start_time: data.start_time,
        end_time: data.end_time,
        location: data.location,
        address: data.address,
        max_participants: data.max_participants,
        requirements: data.requirements,
        what_to_bring: data.what_to_bring,
        organizer_name: data.organizer_name,
        organizer_contact: data.organizer_contact,
        status: data.status,
        created_by: data.created_by,
        updated_at: data.updated_at,
        original_name: originalName
      };

      // Remove old entries if title changed
      if (existingEvent.title !== data.title) {
        this.eventsByTitle.delete(existingEvent.title);
      }

      // Update all maps
      this.eventUpdates.set(originalName, eventUpdate);
      this.eventsByTitle.set(data.title, eventUpdate);
      this.eventsById.set(data.id, eventUpdate);

      // Notify all listeners about the update
      this.notifyListeners();

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
      byId: Array.from(this.eventsById.entries())
    };
  }
}

export const eventDataManager = EventDataManager.getInstance();