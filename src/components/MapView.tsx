import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Home, Info, BookOpen, Mail, LogIn, UserCircle, Search, MapPin, Calendar, Users, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { eventDataManager } from '../lib/eventDataManager';
import DateRangeFilter from './DateRangeFilter';
import MapLegend from './MapLegend';
import { filterCleanupDataByDateRange, filterCleanupDataByEventType } from '../utils/filterUtils';
import 'leaflet/dist/leaflet.css';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

const MapView: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null
  });
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState(eventDataManager.getMergedEventData());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [mapCenter, setMapCenter] = useState<[number, number]>([42.3601, -71.0589]); // Boston center
  const [mapZoom, setMapZoom] = useState(12);
  const [userZipCode, setUserZipCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [showEventsList, setShowEventsList] = useState(false);
  const [showLocationNotFound, setShowLocationNotFound] = useState(false);

  useEffect(() => {
    // Check for user's preferred zip code
    const checkUserZipCode = async () => {
      // First check localStorage for immediate redirect
      const storedZipCode = localStorage.getItem('userZipCode');
      if (storedZipCode) {
        // For Boston area zip codes only
        if (storedZipCode.startsWith('021') || storedZipCode.startsWith('022')) {
          setMapCenter([42.3601, -71.0589]);
          setMapZoom(13);
          setUserZipCode(storedZipCode);
          setCurrentLocation(storedZipCode);
        }
        localStorage.removeItem('userZipCode');
        return;
      }

      // Then check user profile in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('zip_code')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.zip_code && (profile.zip_code.startsWith('021') || profile.zip_code.startsWith('022'))) {
          setMapCenter([42.3601, -71.0589]);
          setMapZoom(13);
          setUserZipCode(profile.zip_code);
          setCurrentLocation(profile.zip_code);
        }
      }
    };

    checkUserZipCode();
  }, []);

  useEffect(() => {
    // Listen for event data updates
    const unsubscribe = eventDataManager.addListener(() => {
      console.log('Event data updated, refreshing map...');
      const mergedData = eventDataManager.getMergedEventData();
      applyFilters(mergedData);
      // Force map to re-render with new data
      setMapKey(prev => prev + 1);
    });

    // Listen for admin event creation
    const handleAdminEventCreated = () => {
      console.log('Admin event created, refreshing map data...');
      const mergedData = eventDataManager.getMergedEventData();
      applyFilters(mergedData);
      setMapKey(prev => prev + 1);
    };

    window.addEventListener('adminEventCreated', handleAdminEventCreated);

    return () => {
      unsubscribe();
      window.removeEventListener('adminEventCreated', handleAdminEventCreated);
    };
  }, []);

  const applyFilters = (data: any) => {
    let filtered = data;

    // Apply date range filter
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filterCleanupDataByDateRange(filtered, dateRange.startDate, dateRange.endDate);
    }

    // Apply event type filter
    if (selectedEventTypes.length > 0) {
      filtered = filterCleanupDataByEventType(filtered, selectedEventTypes);
    }

    console.log('Applying filters to data:', {
      originalFeatures: data.features.length,
      filteredFeatures: filtered.features.length,
      dateRange: dateRange,
      eventTypes: selectedEventTypes
    });

    setFilteredData(filtered);
  };

  useEffect(() => {
    const mergedData = eventDataManager.getMergedEventData();
    console.log('Initial merged data:', {
      totalFeatures: mergedData.features.length,
      featureNames: mergedData.features.map(f => f.properties.name)
    });
    applyFilters(mergedData);
  }, [dateRange, selectedEventTypes]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
    });

    // Get initial auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();

    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();
    
    // Simple Boston area search
    if (query.includes('boston') || query.startsWith('021') || query.startsWith('022')) {
      setMapCenter([42.3601, -71.0589]);
      setMapZoom(13);
      setCurrentLocation(searchQuery.trim());
      setUserZipCode(null);
      setShowEventsList(true);
      setShowLocationNotFound(false);
      setMapKey(prev => prev + 1);
    } else {
      // Show location not found message
      setShowLocationNotFound(true);
      setTimeout(() => {
        setShowLocationNotFound(false);
      }, 8000);
    }
  };

  const getFeatureStyle = (feature: any) => {
    const { eventType } = feature.properties;
    
    switch (eventType) {
      case 'treePlanting':
        return {
          fillColor: '#10b981',
          weight: 2,
          opacity: 1,
          color: '#047857',
          dashArray: '',
          fillOpacity: 0.7
        };
      case 'garden':
        return {
          fillColor: '#f59e0b',
          weight: 2,
          opacity: 1,
          color: '#b45309',
          dashArray: '',
          fillOpacity: 0.7
        };
      default:
        return {
          fillColor: '#3b82f6',
          weight: 2,
          opacity: 1,
          color: '#1d4ed8',
          dashArray: '',
          fillOpacity: 0.7
        };
    }
  };

  const onEachFeature = (feature: any, layer: any) => {
    layer.on('click', () => {
      navigate(`/event/${encodeURIComponent(feature.properties.name)}`);
    });
    
    if (feature.properties) {
      const { eventType, trees, plots, time, location } = feature.properties;
      let tooltipContent;
      
      switch (eventType) {
        case 'treePlanting':
          tooltipContent = `
            <div>
              <strong>${feature.properties.name}</strong><br/>
              <span>Type: ${feature.properties.type}</span><br/>
              <span>Trees to Plant: ${trees}</span><br/>
              <span>Date: ${new Date(feature.properties.date).toLocaleDateString()}</span><br/>
              ${time ? `<span>Time: ${time}</span><br/>` : ''}
              ${location ? `<span>Location: ${location}</span>` : ''}
            </div>
          `;
          break;
        case 'garden':
          tooltipContent = `
            <div>
              <strong>${feature.properties.name}</strong><br/>
              <span>Type: ${feature.properties.type}</span><br/>
              <span>Garden Plots: ${plots}</span><br/>
              <span>Date: ${new Date(feature.properties.date).toLocaleDateString()}</span><br/>
              ${time ? `<span>Time: ${time}</span><br/>` : ''}
              ${location ? `<span>Location: ${location}</span>` : ''}
            </div>
          `;
          break;
        default:
          tooltipContent = `
            <div>
              <strong>${feature.properties.name}</strong><br/>
              <span>Type: ${feature.properties.type}</span><br/>
              <span>Date: ${new Date(feature.properties.date).toLocaleDateString()}</span><br/>
              ${time ? `<span>Time: ${time}</span><br/>` : ''}
              ${location ? `<span>Location: ${location}</span>` : ''}
            </div>
          `;
      }
      
      layer.bindTooltip(tooltipContent, { sticky: true });
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

  const navigationItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Info, label: 'About', path: '/about' },
    { icon: BookOpen, label: 'Resources', path: '/resources' },
    { icon: Mail, label: 'Contact', path: '/contact' }
  ];

  // Debug logging for rendering
  console.log('MapView render:', {
    filteredDataFeatures: filteredData.features.length,
    mapKey: mapKey,
    mapCenter: mapCenter,
    mapZoom: mapZoom
  });

  return (
    <div className="relative w-full h-full flex">
      {/* Left sidebar with search, filters and navigation */}
      <div className="w-80 bg-white shadow-lg z-[1001] overflow-y-auto">
        <div className="p-4">
          {/* Search Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Find Boston Sustainability Events</h2>
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Boston zip code or 'Boston'..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Search Events
              </button>
            </form>
            
            {/* Location Not Found Message */}
            {showLocationNotFound && (
              <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-amber-900 font-medium text-sm">Location Not Found</h4>
                    <p className="text-amber-800 text-sm mt-1">
                      Events are currently only available in Boston, Massachusetts.
                    </p>
                    <p className="text-amber-700 text-xs mt-2">
                      Try searching for "Boston" or a Boston zip code (021xx, 022xx).
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Current Location Indicator */}
            {(currentLocation || userZipCode) && !showLocationNotFound && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <p className="text-emerald-800 text-sm font-medium">
                    {currentLocation ? `Showing events near ${currentLocation}` : `Showing events near ${userZipCode}`}
                  </p>
                </div>
                {userZipCode && !currentLocation && (
                  <p className="text-emerald-700 text-xs mt-1">
                    From your profile preferences
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Events List Toggle */}
          {filteredData.features.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowEventsList(!showEventsList)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {showEventsList ? 'Hide Events List' : `Show Events List (${filteredData.features.length})`}
              </button>
            </div>
          )}

          {/* Events List */}
          {showEventsList && (
            <div className="mb-6 max-h-96 overflow-y-auto">
              <h3 className="text-md font-semibold text-gray-800 mb-3">Events in Boston Area</h3>
              <div className="space-y-3">
                {filteredData.features.map((feature: any, index: number) => (
                  <div
                    key={`${feature.properties.name}-${index}`}
                    className="border border-gray-200 rounded-lg p-3 hover:border-emerald-500 transition-colors cursor-pointer"
                    onClick={() => navigate(`/event/${encodeURIComponent(feature.properties.name)}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{feature.properties.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(feature.properties.eventType)}`}>
                        {getEventTypeLabel(feature.properties.eventType)}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(feature.properties.date).toLocaleDateString()}</span>
                      </div>
                      
                      {feature.properties.time && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{feature.properties.time}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{feature.properties.location}</span>
                      </div>
                      
                      {feature.properties.eventType === 'treePlanting' && feature.properties.trees && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{feature.properties.trees} trees to plant</span>
                        </div>
                      )}
                      
                      {feature.properties.eventType === 'garden' && feature.properties.plots && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{feature.properties.plots} garden plots</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <DateRangeFilter 
            onDateRangeChange={setDateRange}
            onEventTypeChange={setSelectedEventTypes}
            dateRange={dateRange}
            selectedEventTypes={selectedEventTypes}
          />
          
          {/* Navigation Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Navigation</h3>
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors duration-200"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              
              {/* Authentication Button */}
              <div className="flex justify-center mt-4">
                {isAuthenticated ? (
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors duration-200"
                  >
                    <UserCircle className="w-5 h-5" />
                    <span className="font-medium">Profile</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/auth')}
                    className="flex items-center space-x-3 px-4 py-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors duration-200"
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="font-medium">Login / Sign Up</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Map container */}
      <div className="flex-1">
        <MapContainer
          key={`map-${mapKey}`}
          center={mapCenter}
          zoom={mapZoom}
          className="w-full h-full"
          zoomControl={false}
        >
          <ZoomControl position="topright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {filteredData.features.map((feature: any, index: number) => {
            // Create a unique key that includes the event ID if available
            const eventId = feature.properties.id || feature.properties.name;
            const uniqueKey = `${feature.properties.name}-${index}-${eventId}-${mapKey}`;
            
            console.log(`Rendering GeoJSON feature: ${feature.properties.name} with key: ${uniqueKey}`);
            
            return (
              <GeoJSON
                key={uniqueKey}
                data={feature}
                style={getFeatureStyle}
                onEachFeature={onEachFeature}
              />
            );
          })}
        </MapContainer>
      </div>
      
      {/* Legend positioned on the bottom right side of the map */}
      <div className="absolute bottom-4 right-4 z-[1000] pointer-events-auto">
        <MapLegend />
      </div>
    </div>
  );
};

export default MapView;