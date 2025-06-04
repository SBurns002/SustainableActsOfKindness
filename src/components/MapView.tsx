import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Polygon } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import DateRangeFilter from './DateRangeFilter';
import MapLegend from './MapLegend';
import { cleanupData } from '../data/cleanupData';
import { filterCleanupDataByDateRange } from '../utils/filterUtils';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

const mapStyles = {
  styles: [
    {
      featureType: 'all',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'administrative',
      elementType: 'geometry',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'road',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'transit',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'poi',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#e9e9e9' }]
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }]
    }
  ]
};

const MapView: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null
  });
  const [filteredData, setFilteredData] = useState(cleanupData);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      const filtered = filterCleanupDataByDateRange(cleanupData, dateRange.startDate, dateRange.endDate);
      setFilteredData(filtered);
    } else {
      setFilteredData(cleanupData);
    }
  }, [dateRange]);

  const getPolygonOptions = (feature: any) => {
    const { eventType } = feature.properties;
    
    switch (eventType) {
      case 'treePlanting':
        return {
          fillColor: '#059669',
          strokeColor: '#065f46',
          strokeWeight: 2,
          fillOpacity: 0.7
        };
      case 'garden':
        return {
          fillColor: '#B45309',
          strokeColor: '#92400E',
          strokeWeight: 2,
          fillOpacity: 0.7
        };
      default:
        return {
          fillColor: '#0EA5E9',
          strokeColor: '#0369A1',
          strokeWeight: 2,
          fillOpacity: 0.7
        };
    }
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="absolute top-4 left-4 right-4 z-[1001] bg-white rounded-lg shadow-lg p-4 max-w-md mx-auto">
        <DateRangeFilter 
          onDateRangeChange={setDateRange}
          dateRange={dateRange}
        />
      </div>
      
      <div className="flex-1">
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerClassName="w-full h-full"
            center={{ lat: 42.3601, lng: -71.0589 }}
            zoom={12}
            options={mapStyles}
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            {filteredData.features.map((feature: any, index: number) => {
              const coordinates = feature.geometry.coordinates[0].map((coord: number[]) => ({
                lat: coord[1],
                lng: coord[0]
              }));

              return (
                <Polygon
                  key={`${feature.properties.name}-${index}`}
                  paths={coordinates}
                  options={getPolygonOptions(feature)}
                  onClick={() => navigate(`/event/${encodeURIComponent(feature.properties.name)}`)}
                />
              );
            })}
          </GoogleMap>
        </LoadScript>
      </div>
      
      <div className="absolute bottom-4 right-4 z-[1000]">
        <MapLegend />
      </div>
    </div>
  );
};

export default MapView;