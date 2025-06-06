import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Home, Info, BookOpen, Mail, LogIn, UserCircle, Search, MapPin, Calendar, Users, Clock } from 'lucide-react';
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

// Enhanced geocoding function for US zip codes and cities
const getLocationCoordinates = (location: string): [number, number] | null => {
  const cleanLocation = location.trim().toLowerCase();
  
  // Zip code mapping (expanded)
  const zipCodeMap: { [key: string]: [number, number] } = {
    // Massachusetts
    '02101': [42.3601, -71.0589], // Boston
    '02139': [42.3736, -71.1097], // Cambridge
    '02143': [42.3875, -71.0995], // Somerville
    '02116': [42.3467, -71.0972], // Back Bay
    '02215': [42.3467, -71.0972], // Fenway
    '02121': [42.3188, -71.0846], // Roxbury
    '01970': [42.5195, -70.8967], // Salem
    '02703': [41.9465, -71.2928], // Attleboro
    '02760': [41.9676, -71.3495], // North Attleborough
    '02180': [42.4751, -71.1056], // Stoneham
    '01742': [42.4370, -71.3495], // Concord
    '01007': [42.2751, -72.4009], // Belchertown
    '02667': [41.9342, -69.9723], // Wellfleet
    '01237': [42.6334, -73.1673], // Lanesborough
    
    // Other major cities
    '10001': [40.7505, -73.9934], // New York, NY
    '90210': [34.0901, -118.4065], // Beverly Hills, CA
    '60614': [41.9278, -87.6431], // Chicago, IL
    '33034': [25.4587, -80.4776], // Homestead, FL
    '75218': [32.8140, -96.7236], // Dallas, TX
    '59936': [48.7596, -113.7870], // West Glacier, MT
    '11201': [40.6892, -73.9442], // Brooklyn, NY
    '85008': [33.4734, -112.0740], // Phoenix, AZ
    '98199': [47.6587, -122.4058], // Seattle, WA
    '97204': [45.5152, -122.6784], // Portland, OR
    '78746': [30.2672, -97.7431], // Austin, TX
  };

  // City + State mapping
  const cityStateMap: { [key: string]: [number, number] } = {
    'boston, ma': [42.3601, -71.0589],
    'boston, massachusetts': [42.3601, -71.0589],
    'cambridge, ma': [42.3736, -71.1097],
    'cambridge, massachusetts': [42.3736, -71.1097],
    'salem, ma': [42.5195, -70.8967],
    'salem, massachusetts': [42.5195, -70.8967],
    'new york, ny': [40.7505, -73.9934],
    'new york, new york': [40.7505, -73.9934],
    'chicago, il': [41.8781, -87.6298],
    'chicago, illinois': [41.8781, -87.6298],
    'los angeles, ca': [34.0522, -118.2437],
    'los angeles, california': [34.0522, -118.2437],
    'seattle, wa': [47.6062, -122.3321],
    'seattle, washington': [47.6062, -122.3321],
    'portland, or': [45.5152, -122.6784],
    'portland, oregon': [45.5152, -122.6784],
    'austin, tx': [30.2672, -97.7431],
    'austin, texas': [30.2672, -97.7431],
    'miami, fl': [25.7617, -80.1918],
    'miami, florida': [25.7617, -80.1918],
    'denver, co': [39.7392, -104.9903],
    'denver, colorado': [39.7392, -104.9903],
    'phoenix, az': [33.4484, -112.0740],
    'phoenix, arizona': [33.4484, -112.0740],
  };

  // Check if it's a zip code (5 digits)
  const zipMatch = cleanLocation.match(/^\d{5}$/);
  if (zipMatch) {
    const zip = zipMatch[0];
    if (zipCodeMap[zip]) {
      return zipCodeMap[zip];
    }
    
    // Try partial matches for nearby areas
    const zipPrefix = zip.substring(0, 3);
    for (const [zipCode, coords] of Object.entries(zipCodeMap)) {
      if (zipCode.startsWith(zipPrefix)) {
        return coords;
      }
    }
  }

  // Check city, state format
  if (cityStateMap[cleanLocation]) {
    return cityStateMap[cleanLocation];
  }

  // Try variations with common abbreviations
  const variations = [
    cleanLocation.replace(/\bmass\b/, 'massachusetts'),
    cleanLocation.replace(/\bmassachusetts\b/, 'ma'),
    cleanLocation.replace(/\bcalifornia\b/, 'ca'),
    cleanLocation.replace(/\bca\b/, 'california'),
    cleanLocation.replace(/\btexas\b/, 'tx'),
    cleanLocation.replace(/\btx\b/, 'texas'),
    cleanLocation.replace(/\bflorida\b/, 'fl'),
    cleanLocation.replace(/\bfl\b/, 'florida'),
  ];

  for (const variation of variations) {
    if (cityStateMap[variation]) {
      return cityStateMap[variation];
    }
  }

  return null;
};

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
  const [mapCenter, setMapCenter] = useState<[number, number]>([42.3601, -71.0589]);
  const [mapZoom, setMapZoom] = useState(12);
  const [userZipCode, setUserZipCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [showEventsList, setShowEventsList] = useState(false);

  useEffect(() => {
    // Check for user's preferred zip code
    const checkUserZipCode = async () => {
      // First check localStorage for immediate redirect
      const storedZipCode = localStorage.getItem('userZipCode');
      if (storedZipCode) {
        const coords = getLocationCoordinates(storedZipCode);
        if (coords) {
          setMapCenter(coords);
          setMapZoom(13);
          setUserZipCode(storedZipCode);
          setCurrentLocation(storedZipCode);
          // Clear from localStorage after using it
          localStorage.removeItem('userZipCode');
        }
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

        if (profile?.zip_code) {
          const coords = getLocationCoordinates(profile.zip_code);
          if (coords) {
            setMapCenter(coords);
            setMapZoom(13);
            setUserZipCode(profile.zip_code);
            setCurrentLocation(profile.zip_code);
          }
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

    return unsubscribe;
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

    setFilteredData(filtered);
  };

  useEffect(() => {
    const mergedData = eventDataManager.getMergedEventData();
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

    const coords = getLocationCoordinates(searchQuery.trim());
    if (coords) {
      setMapCenter(coords);
      setMapZoom(13);
      setCurrentLocation(searchQuery.trim());
      setUserZipCode(null); // Clear user zip code indicator since this is a search
      setShowEventsList(true);
      setMapKey(prev => prev + 1);
    } else {
      // Show error or suggestion
      alert('Location not found. Please try a zip code (e.g., 02101) or city, state (e.g., Boston, MA)');
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

  return (
    <div className="relative w-full h-full flex">
      {/* Left sidebar with search, filters and navigation */}
      <div className="w-80 bg-white shadow-lg z-[1001] overflow-y-auto">
        <div className="p-4">
          {/* Search Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Find Sustainability Events</h2>
            <form onSubmit={handleSearch} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter zip code or city, state..."
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
            
            {/* Current Location Indicator */}
            {(currentLocation || userZipCode) && (
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
              <h3 className="text-md font-semibold text-gray-800 mb-3">Events in This Area</h3>
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
          key={`${mapKey}-${mapCenter[0]}-${mapCenter[1]}`}
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
          
          {filteredData.features.map((feature: any, index: number) => (
            <GeoJSON
              key={`${feature.properties.name}-${index}-${feature.properties.updated_at || 'static'}-${mapKey}`}
              data={feature}
              style={getFeatureStyle}
              onEachFeature={onEachFeature}
            />
          ))}
        </MapContainer>
      </div>
      
      {/* Legend positioned on the right side of the map */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <MapLegend />
      </div>
    </div>
  );
};

export default MapView;