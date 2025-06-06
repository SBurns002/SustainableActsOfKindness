import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Home, Info, BookOpen, Mail, LogIn, UserCircle, MapPin, Calendar, Users, Clock } from 'lucide-react';
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
  const [showEventsList, setShowEventsList] = useState(false);

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

  // Function to check if an event is in the Boston area
  const isBostonAreaEvent = (feature: any) => {
    const location = feature.properties.location?.toLowerCase() || '';
    const address = feature.properties.address?.toLowerCase() || '';
    
    // Check for Massachusetts and Boston area indicators
    const bostonKeywords = [
      'boston', 'cambridge', 'somerville', 'charlestown', 'brookline',
      'newton', 'watertown', 'medford', 'malden', 'everett',
      'chelsea', 'revere', 'winthrop', 'quincy', 'milton',
      'dedham', 'needham', 'wellesley', 'waltham', 'arlington',
      'belmont', 'lexington', 'concord', 'lincoln', 'weston',
      'massachusetts', 'ma', 'mass'
    ];
    
    // Check if location or address contains Boston area keywords
    const isInBostonArea = bostonKeywords.some(keyword => 
      location.includes(keyword) || address.includes(keyword)
    );
    
    // Also check coordinates - Boston area is roughly between these bounds
    if (feature.geometry && feature.geometry.coordinates) {
      const coords = feature.geometry.coordinates[0]; // Get first coordinate of polygon
      if (coords && coords.length > 0) {
        const [lng, lat] = coords[0]; // First point of the polygon
        
        // Boston metropolitan area bounds (approximate)
        const bostonBounds = {
          north: 42.8,   // North of Boston
          south: 42.0,   // South of Boston
          east: -70.5,   // East (Atlantic coast)
          west: -71.8    // West of Boston
        };
        
        const isInBounds = lat >= bostonBounds.south && 
                          lat <= bostonBounds.north && 
                          lng >= bostonBounds.west && 
                          lng <= bostonBounds.east;
        
        return isInBostonArea || isInBounds;
      }
    }
    
    return isInBostonArea;
  };

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

  // Filter events to only show Boston area events in the list
  const bostonAreaEvents = filteredData.features.filter(isBostonAreaEvent);

  // Debug logging for rendering
  console.log('MapView render:', {
    filteredDataFeatures: filteredData.features.length,
    bostonAreaEvents: bostonAreaEvents.length,
    mapKey: mapKey,
    mapCenter: mapCenter,
    mapZoom: mapZoom
  });

  return (
    <div className="relative w-full h-full flex">
      {/* Left sidebar with filters and navigation */}
      <div className="w-80 bg-white shadow-lg z-[1001] overflow-y-auto">
        <div className="p-4">
          {/* Events List Toggle */}
          {bostonAreaEvents.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowEventsList(!showEventsList)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {showEventsList ? 'Hide Events List' : `Show Boston Events (${bostonAreaEvents.length})`}
              </button>
            </div>
          )}

          {/* Events List - Only Boston Area Events */}
          {showEventsList && (
            <div className="mb-6 max-h-96 overflow-y-auto">
              <h3 className="text-md font-semibold text-gray-800 mb-3">Events in Boston Area</h3>
              <div className="space-y-3">
                {bostonAreaEvents.map((feature: any, index: number) => (
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
              
              {/* Show info about filtered out events */}
              {filteredData.features.length > bostonAreaEvents.length && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> {filteredData.features.length - bostonAreaEvents.length} events outside the Boston area are hidden from this list but still visible on the map.
                  </p>
                </div>
              )}
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
      
      {/* Legend positioned fixed to viewport bottom right */}
      <div className="fixed bottom-4 right-4 z-[1000] pointer-events-auto">
        <MapLegend />
      </div>
    </div>
  );
};

export default MapView;