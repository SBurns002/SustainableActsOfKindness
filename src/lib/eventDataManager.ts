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
}

class EventDataManager {
  private static instance: EventDataManager;
  private eventUpdates: Map<string, EventUpdate> = new Map();
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

      // Store updates in memory for quick access
      events?.forEach(event => {
        this.eventUpdates.set(event.title, {
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
          updated_at: event.updated_at
        });
      });

      this.notifyListeners();
    } catch (error) {
      console.error('Error loading event updates:', error);
    }
  }

  // Get merged event data (static + updates)
  getMergedEventData() {
    const mergedData = { ...cleanupData };
    
    mergedData.features = cleanupData.features.map(feature => {
      const eventName = feature.properties.name;
      const update = this.eventUpdates.get(eventName);
      
      if (update) {
        // Merge the update with the original feature
        return {
          ...feature,
          properties: {
            ...feature.properties,
            name: update.title,
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
            updated_at: update.updated_at
          }
        };
      }
      
      return feature;
    });

    return mergedData;
  }

  // Get a specific event by name
  getEventByName(eventName: string) {
    const mergedData = this.getMergedEventData();
    return mergedData.features.find(
      feature => feature.properties.name === eventName
    );
  }

  // Update an event (called from admin dashboard)
  async updateEvent(eventId: string, eventData: any) {
    try {
      // First, get the existing event to preserve the created_by field
      const { data: existingEvent, error: fetchError } = await supabase
        .from('events')
        .select('created_by')
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

      // Update local cache
      this.eventUpdates.set(data.title, {
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
        updated_at: data.updated_at
      });

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
}

export const eventDataManager = EventDataManager.getInstance();