import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Home, Info, BookOpen, Mail, LogIn, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import DateRangeFilter from './DateRangeFilter';
import MapLegend from './MapLegend';
import { cleanupData } from '../data/cleanupData';
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
  const [filteredData, setFilteredData] = useState(cleanupData);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let filtered = cleanupData;

    // Apply date range filter
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filterCleanupDataByDateRange(filtered, dateRange.startDate, dateRange.endDate);
    }

    // Apply event type filter
    if (selectedEventTypes.length > 0) {
      filtered = filterCleanupDataByEventType(filtered, selectedEventTypes);
    }

    setFilteredData(filtered);
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
      const { eventType, trees, plots } = feature.properties;
      let tooltipContent;
      
      switch (eventType) {
        case 'treePlanting':
          tooltipContent = `
            <div>
              <strong>${feature.properties.name}</strong><br/>
              <span>Type: ${feature.properties.type}</span><br/>
              <span>Trees to Plant: ${trees}</span><br/>
              <span>Date: ${new Date(feature.properties.date).toLocaleDateString()}</span>
            </div>
          `;
          break;
        case 'garden':
          tooltipContent = `
            <div>
              <strong>${feature.properties.name}</strong><br/>
              <span>Type: ${feature.properties.type}</span><br/>
              <span>Garden Plots: ${plots}</span><br/>
              <span>Date: ${new Date(feature.properties.date).toLocaleDateString()}</span>
            </div>
          `;
          break;
        default:
          tooltipContent = `
            <div>
              <strong>${feature.properties.name}</strong><br/>
              <span>Type: ${feature.properties.type}</span><br/>
              <span>Date: ${new Date(feature.properties.date).toLocaleDateString()}</span>
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
          <DateRangeFilter 
            onDateRangeChange={setDateRange}
            onEventTypeChange={setSelectedEventTypes}
            dateRange={dateRange}
            selectedEventTypes={selectedEventTypes}
          />
          
          {/* Navigation Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Navigation</h3>
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
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors duration-200"
                >
                  <UserCircle className="w-5 h-5" />
                  <span className="font-medium">Profile</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors duration-200"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="font-medium">Login / Sign Up</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Map container */}
      <div className="flex-1">
        <MapContainer
          center={[42.3601, -71.0589]}
          zoom={12}
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
              key={`${feature.properties.name}-${index}`}
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