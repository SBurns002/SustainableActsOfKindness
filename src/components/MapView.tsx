import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Tooltip } from 'react-leaflet';
import DateRangeFilter from './DateRangeFilter';
import MapLegend from './MapLegend';
import { cleanupData } from '../data/cleanupData';
import { filterCleanupDataByDateRange } from '../utils/filterUtils';
import 'leaflet/dist/leaflet.css';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

const MapView: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null
  });
  const [filteredData, setFilteredData] = useState(cleanupData);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      const filtered = filterCleanupDataByDateRange(cleanupData, dateRange.startDate, dateRange.endDate);
      setFilteredData(filtered);
    } else {
      setFilteredData(cleanupData);
    }
  }, [dateRange]);

  const getFeatureStyle = (feature: any) => {
    const priority = feature.properties.priority;
    let fillColor;
    
    switch (priority) {
      case 'high':
        fillColor = '#EF4444'; // red
        break;
      case 'medium':
        fillColor = '#F59E0B'; // amber
        break;
      case 'low':
        fillColor = '#10B981'; // green
        break;
      default:
        fillColor = '#6B7280'; // gray
    }
    
    return {
      fillColor,
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    if (feature.properties) {
      layer.bindTooltip(`
        <div>
          <strong>${feature.properties.name}</strong><br/>
          <span>Type: ${feature.properties.type}</span><br/>
          <span>Priority: ${feature.properties.priority}</span><br/>
          <span>Date: ${new Date(feature.properties.date).toLocaleDateString()}</span>
        </div>
      `, { sticky: true });
    }
  };

  return (
    <div className="relative h-full">
      <div className="absolute top-4 left-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-md mx-auto">
        <DateRangeFilter 
          onDateRangeChange={setDateRange}
          dateRange={dateRange}
        />
      </div>
      
      <MapContainer
        center={[39.8283, -98.5795]} // Center of the continental US
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
      
      <div className="absolute bottom-4 right-4 z-[1000]">
        <MapLegend />
      </div>
    </div>
  );
};

export default MapView;