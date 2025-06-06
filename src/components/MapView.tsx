import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Home, Info, BookOpen, Mail, LogIn, UserCircle } from 'lucide-react';
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

// Simple geocoding function for US zip codes (approximate center coordinates)
const getZipCodeCoordinates = (zipCode: string): [number, number] | null => {
  // This is a simplified geocoding - in production you'd use a proper geocoding service
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

  // Remove any non-digit characters and get first 5 digits
  const cleanZip = zipCode.replace(/\D/g, '').substring(0, 5);
  
  // Try exact match first
  if (zipCodeMap[cleanZip]) {
    return zipCodeMap[cleanZip];
  }
  
  // Try partial matches for nearby areas
  const zipPrefix = cleanZip.substring(0, 3);
  for (const [zip, coords] of Object.entries(zipCodeMap)) {
    if (zip.startsWith(zipPrefix)) {
      return coords;
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
  const [mapKey, setMapKey] = useState(0); // Force map re-render when data changes
  const [mapCenter, setMapCenter] = useState<[number, number]>([42.3601, -71.0589]); // Default to Boston
  const [mapZoom, setMapZoom] = useState(12);
  const [userZipCode, setUserZipCode] = useState<string | null>(null);

  useEffect(() => {
    // Check for user's preferred zip code
    const checkUserZipCode = async () => {
      // First check localStorage for immediate redirect
      const storedZipCode = localStorage.getItem('userZipCode');
      if (storedZipCode) {
        const coords = getZipCodeCoordinates(storedZipCode);
        if (coords) {
          setMapCenter(coords);
          setMapZoom(13);
          setUserZipCode(storedZipCode);
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
          const coords = getZipCodeCoordinates(profile.zip_code);
          if (coords) {
            setMapCenter(coords);
            setMapZoom(13);
            setUserZipCode(profile.zip_code);
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
      // Use the current name (which might be updated) for navigation
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

  const navigationItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Info, label: 'About', path: '/about' },
    { icon: BookOpen, label: 'Resources', path: '/resources' },
    { icon: Mail, label: 'Contact', path: '/contact' }
  ];

  return (
    <div className="relative w-full h-full flex">
      {/* Left sidebar with filters and navigation */}
      <div className="w-80 bg-white shadow-lg z-[1001] overflow-y-auto">
        <div className="p-4">
          {userZipCode && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-emerald-800 text-sm font-medium">
                📍 Showing events near {userZipCode}
              </p>
              <p className="text-emerald-700 text-xs mt-1">
                Update your location in your profile to see events in a different area
              </p>
            </div>
          )}
          
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
          key={`${mapKey}-${mapCenter[0]}-${mapCenter[1]}`} // Force re-render when center changes
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