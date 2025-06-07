// Add this to the debug function to center map on test events
  const debugTestingEvent = () => {
    console.log('=== DEBUGGING TESTING EVENT ===');
    eventDataManager.debugEvent('Testing');
    console.log('Current filtered data features:', filteredData.features.map(f => f.properties.name));
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
      console.log('After refresh - merged data features:', newData.features.map(f => f.properties.name));
      applyFilters(newData);
      setMapKey(prev => prev + 1);
    });
  };

export default debugTestingEvent