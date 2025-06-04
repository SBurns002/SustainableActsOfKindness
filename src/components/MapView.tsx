import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Tooltip, ZoomControl } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
    const { eventType } = feature.properties;
    
    switch (eventType) {
      case 'treePlanting':
        return {
          fillColor: '#059669',
          weight: 2,
          opacity: 1,
          color: '#065f46',
          dashArray: '3',
          fillOpacity: 0.7
        };
      case 'garden':
        return {
          fillColor: '#B45309',
          weight: 2,
          opacity: 1,
          color: '#92400E',
          dashArray: '3',
          fillOpacity: 0.7
        };
      default:
        return {
          fillColor: '#0EA5E9',
          weight: 2,
          opacity: 1,
          color: '#0369A1',
          dashArray: '3',
          fillOpacity: 0.7
        };
    }
  };

  const onEachFeature = (feature: any, layer: any) => {
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
      
      layer.on('click', () => {
        navigate(`/event/${encodeURIComponent(feature.properties.name)}`);
      });
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="absolute top-4 left-4 right-4 z-[1001] bg-white rounded-lg shadow-lg p-4 max-w-md mx-auto">
        <DateRangeFilter 
          onDateRangeChange={setDateRange}
          dateRange={dateRange}
        />
      </div>
      
      <div className="flex-1">
        <MapContainer
          center={[42.3601, -71.0589]}
          zoom={12}
          className="w-full h-full"
          zoomControl={false}
        >
          <ZoomControl position="topright" />
          <TileLayer
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
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
      
      <div className="absolute bottom-4 right-4 z-[1000]">
        <MapLegend />
      </div>
    </div>
  );
};

export default MapView;