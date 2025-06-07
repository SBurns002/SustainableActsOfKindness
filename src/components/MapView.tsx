import React, { useState, useEffect } from 'react';
import { eventDataManager } from '../lib/eventDataManager';

interface MapViewProps {
  // Add any props that might be needed
}

const MapView: React.FC<MapViewProps> = () => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([42.3601, -71.0589]);
  const [mapZoom, setMapZoom] = useState(15);
  const [mapKey, setMapKey] = useState(0);
  const [filteredData, setFilteredData] = useState({ features: [] });

  const applyFilters = (data: any) => {
    setFilteredData(data);
  };

  // Add this to the debug function to center map on test events
  const debugTestingEvent = () => {
    console.log('=== DEBUGGING TESTING EVENT ===');
    eventDataManager.debugEvent('Testing');
    console.log('Current filtered data features:', filteredData.features.map((f: any) => f.properties.name));
    console.log('Map key:', mapKey);
    console.log('Filtered data:', filteredData);
    console.log('Map center:', mapCenter);
    console.log('Map zoom:', mapZoom);
    
    // Force map to center on Boston where test events are located
    setMapCenter([42.3601, -71.0589]); // Downtown Boston
    setMapZoom(15); // Zoom in closer
    
    // Force a complete refresh
    eventDataManager.refresh().then(() => {
      const newData = eventDataManager.getMergedEventData();
      console.log('After refresh - merged data features:', newData.features.map((f: any) => f.properties.name));
      applyFilters(newData);
      setMapKey(prev => prev + 1);
    });
  };

  useEffect(() => {
    // Initialize the component
    const initializeData = async () => {
      try {
        await eventDataManager.refresh();
        const data = eventDataManager.getMergedEventData();
        applyFilters(data);
      } catch (error) {
        console.error('Error initializing map data:', error);
      }
    };

    initializeData();
  }, []);

  return (
    <div className="map-view">
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Map View</h2>
        <button 
          onClick={debugTestingEvent}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          Debug Testing Event
        </button>
        <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
          <p className="text-gray-600">Map component will be rendered here</p>
          <p className="text-sm text-gray-500 ml-2">
            (Center: {mapCenter[0]}, {mapCenter[1]} | Zoom: {mapZoom} | Key: {mapKey})
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapView;