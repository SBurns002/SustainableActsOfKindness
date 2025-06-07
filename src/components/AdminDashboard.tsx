import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { eventDataManager } from '../lib/eventDataManager';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  Eye,
  Filter,
  Search,
  Shield,
  UserPlus,
  UserMinus,
  Settings,
  TestTube
} from 'lucide-react';
import toast from 'react-hot-toast';
import MFAAPITest from './MFAAPITest';

interface Event {
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
  current_participants: number;
  requirements?: string[];
  what_to_bring?: string[];
  organizer_name: string;
  organizer_contact?: string;
  status: string;
  metadata?: any;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface AdminUser {
  user_id: string;
  email: string;
  assigned_at: string;
  assigned_by_email: string;
}

// Boston neighborhoods and areas
const BOSTON_LOCATIONS = [
  'Back Bay, Boston, MA',
  'Beacon Hill, Boston, MA',
  'North End, Boston, MA',
  'South End, Boston, MA',
  'Downtown Boston, MA',
  'Financial District, Boston, MA',
  'Chinatown, Boston, MA',
  'South Boston, MA',
  'East Boston, MA',
  'Charlestown, Boston, MA',
  'Jamaica Plain, Boston, MA',
  'Roxbury, Boston, MA',
  'Dorchester, Boston, MA',
  'Mattapan, Boston, MA',
  'Roslindale, Boston, MA',
  'West Roxbury, Boston, MA',
  'Hyde Park, Boston, MA',
  'Allston, Boston, MA',
  'Brighton, Boston, MA',
  'Fenway, Boston, MA',
  'Mission Hill, Boston, MA',
  'Boston Common, Boston, MA',
  'Public Garden, Boston, MA',
  'Boston Harbor, Boston, MA',
  'Charles River Esplanade, Boston, MA',
  'Franklin Park, Boston, MA',
  'Arnold Arboretum, Boston, MA',
  'Castle Island, Boston, MA',
  'Boston University Area, Boston, MA',
  'Harvard Medical Area, Boston, MA'
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showMFATest, setShowMFATest] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [userManagementLoading, setUserManagementLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'cleanup',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    address: '',
    max_participants: '',
    requirements: [''],
    what_to_bring: [''],
    organizer_name: 'Environmental Protection Group',
    organizer_contact: '',
    status: 'active',
    metadata: {}
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchEvents();
      fetchAdminUsers();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setCurrentUser(user);

      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .limit(1);

      if (error || !roles || roles.length === 0) {
        toast.error('Access denied. Administrator privileges required.');
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('list_admin_users');
      
      if (error) throw error;
      setAdminUsers(data || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast.error('Failed to load admin users');
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setUserManagementLoading(true);
    try {
      const { data, error } = await supabase.rpc('manage_admin_users', {
        target_email: newAdminEmail.trim(),
        action: 'add'
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        setNewAdminEmail('');
        fetchAdminUsers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Failed to add admin user');
    } finally {
      setUserManagementLoading(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (adminUsers.length <= 1) {
      toast.error('Cannot remove the last admin user');
      return;
    }

    setUserManagementLoading(true);
    try {
      const { data, error } = await supabase.rpc('manage_admin_users', {
        target_email: email,
        action: 'remove'
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        fetchAdminUsers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to remove admin user');
    } finally {
      setUserManagementLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.id) {
      toast.error('User not authenticated');
      return;
    }

    // Validate that location is in Boston
    if (!formData.location || !formData.location.toLowerCase().includes('boston')) {
      toast.error('Location must be in Boston, Massachusetts');
      return;
    }
    
    try {
      const eventData = {
        ...formData,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        what_to_bring: formData.what_to_bring.filter(item => item.trim() !== ''),
        event_date: new Date(formData.event_date).toISOString(),
      };

      if (editingEvent) {
        // Update existing event using the event data manager
        await eventDataManager.updateEvent(editingEvent.id, eventData);
        toast.success('Event updated successfully');
      } else {
        const { error } = await supabase
          .from('events')
          .insert({
            ...eventData,
            created_by: currentUser.id
          });

        if (error) throw error;
        toast.success('Event created successfully and added to map');
      }

      setShowEventForm(false);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
      
      // Refresh the event data manager to update all components including the map
      await eventDataManager.refresh();
      
      // Notify that the map should update
      window.dispatchEvent(new CustomEvent('adminEventCreated', { 
        detail: { message: 'New event added to map' } 
      }));
      
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      event_date: new Date(event.event_date).toISOString().split('T')[0],
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      location: event.location,
      address: event.address || '',
      max_participants: event.max_participants?.toString() || '',
      requirements: event.requirements?.length ? event.requirements : [''],
      what_to_bring: event.what_to_bring?.length ? event.what_to_bring : [''],
      organizer_name: event.organizer_name,
      organizer_contact: event.organizer_contact || '',
      status: event.status,
      metadata: event.metadata || {}
    });
    setShowEventForm(true);
  };

  const handleDelete = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      
      toast.success('Event deleted successfully');
      setDeleteConfirm(null);
      fetchEvents();
      
      // Refresh the event data manager
      await eventDataManager.refresh();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'cleanup',
      event_date: '',
      start_time: '',
      end_time: '',
      location: '',
      address: '',
      max_participants: '',
      requirements: [''],
      what_to_bring: [''],
      organizer_name: 'Environmental Protection Group',
      organizer_contact: '',
      status: 'active',
      metadata: {}
    });
  };

  const addArrayField = (field: 'requirements' | 'what_to_bring') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateArrayField = (field: 'requirements' | 'what_to_bring', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeArrayField = (field: 'requirements' | 'what_to_bring', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesEventType = eventTypeFilter === 'all' || event.event_type === eventTypeFilter;
    
    return matchesSearch && matchesStatus && matchesEventType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    switch (eventType) {
      case 'cleanup': return 'Environmental Cleanup';
      case 'treePlanting': return 'Tree Planting';
      case 'garden': return 'Community Garden';
      case 'education': return 'Education';
      case 'workshop': return 'Workshop';
      default: return eventType;
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'cleanup': return 'bg-blue-100 text-blue-800';
      case 'treePlanting': return 'bg-green-100 text-green-800';
      case 'garden': return 'bg-amber-100 text-amber-800';
      case 'education': return 'bg-purple-100 text-purple-800';
      case 'workshop': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking administrator access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Administrator Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage sustainability events in Boston, Massachusetts</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowMFATest(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <TestTube className="w-5 h-5" />
              <span>MFA Test</span>
            </button>
            <button
              onClick={() => setShowUserManagement(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Shield className="w-5 h-5" />
              <span>Manage Admins</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setEditingEvent(null);
                setShowEventForm(true);
              }}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Boston Event</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-emerald-50 rounded-lg p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-emerald-600">Total Events</p>
                <p className="text-2xl font-bold text-emerald-900">{events.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Active Events</p>
                <p className="text-2xl font-bold text-blue-900">
                  {events.filter(e => e.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Total Participants</p>
                <p className="text-2xl font-bold text-purple-900">
                  {events.reduce((sum, e) => sum + e.current_participants, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 rounded-lg p-6">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-amber-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-amber-600">Admin Users</p>
                <p className="text-2xl font-bold text-amber-900">{adminUsers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events..."
                  className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Types</option>
                <option value="cleanup">Environmental Cleanup</option>
                <option value="treePlanting">Tree Planting</option>
                <option value="garden">Community Garden</option>
                <option value="education">Education</option>
                <option value="workshop">Workshop</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setEventTypeFilter('all');
                }}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 mb-4">
                {events.length === 0 ? 'Get started by creating your first Boston event' : 'Try adjusting your search filters'}
              </p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-6 hover:border-emerald-500 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                        {getEventTypeLabel(event.event_type)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{event.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                      
                      {event.start_time && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{event.start_time} {event.end_time && `- ${event.end_time}`}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>
                          {event.current_participants}
                          {event.max_participants && ` / ${event.max_participants}`} participants
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => navigate(`/event/${encodeURIComponent(event.title)}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Event"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(event)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Edit Event"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(event.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MFA Test Modal */}
      {showMFATest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">MFA API Testing Suite</h2>
                <button
                  onClick={() => setShowMFATest(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <MFAAPITest />
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage Administrator Users</h2>
                <button
                  onClick={() => setShowUserManagement(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Add Admin */}
              <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Administrator</h3>
                <div className="flex space-x-4">
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddAdmin}
                    disabled={userManagementLoading || !newAdminEmail.trim()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Admin</span>
                  </button>
                </div>
              </div>

              {/* Current Admins */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Administrators</h3>
                <div className="space-y-3">
                  {adminUsers.map((admin) => (
                    <div key={admin.user_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{admin.email}</p>
                        <p className="text-sm text-gray-600">
                          Added on {new Date(admin.assigned_at).toLocaleDateString()}
                          {admin.assigned_by_email && ` by ${admin.assigned_by_email}`}
                        </p>
                      </div>
                      {adminUsers.length > 1 && (
                        <button
                          onClick={() => handleRemoveAdmin(admin.email)}
                          disabled={userManagementLoading}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed p-2"
                          title="Remove Admin"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowUserManagement(false)}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingEvent ? 'Edit Boston Event' : 'Create New Boston Event'}
                </h2>
                <button
                  onClick={() => {
                    setShowEventForm(false);
                    setEditingEvent(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Type *</label>
                    <select
                      required
                      value={formData.event_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="cleanup">Environmental Cleanup</option>
                      <option value="treePlanting">Tree Planting</option>
                      <option value="garden">Community Garden</option>
                      <option value="education">Education</option>
                      <option value="workshop">Workshop</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.event_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_participants}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_participants: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Boston Location *</label>
                    <select
                      required
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Select a Boston location...</option>
                      {BOSTON_LOCATIONS.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Events are currently restricted to Boston, Massachusetts locations only
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specific Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="e.g., 123 Main St, Boston, MA 02101"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Organizer Name</label>
                    <input
                      type="text"
                      value={formData.organizer_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizer_name: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Organizer Contact</label>
                    <input
                      type="text"
                      value={formData.organizer_contact}
                      onChange={(e) => setFormData(prev => ({ ...prev, organizer_contact: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => updateArrayField('requirements', index, e.target.value)}
                        placeholder="Enter requirement"
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      {formData.requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField('requirements', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField('requirements')}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                  >
                    + Add Requirement
                  </button>
                </div>

                {/* What to Bring */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">What to Bring</label>
                  {formData.what_to_bring.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateArrayField('what_to_bring', index, e.target.value)}
                        placeholder="Enter item to bring"
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      {formData.what_to_bring.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField('what_to_bring', index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField('what_to_bring')}
                    className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventForm(false);
                      setEditingEvent(null);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingEvent ? 'Update Event' : 'Create Event & Add to Map'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this event? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;