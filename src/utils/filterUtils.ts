/**
 * Filter cleanup data by date range
 */
export const filterCleanupDataByDateRange = (
  data: any,
  startDate: Date,
  endDate: Date
) => {
  if (!startDate || !endDate) {
    return data;
  }

  // Set time to beginning and end of day to include all events on those days
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Filter features that have a date within the range
  const filteredFeatures = data.features.filter((feature: any) => {
    const eventDate = new Date(feature.properties.date);
    return eventDate >= start && eventDate <= end;
  });

  // Return a new GeoJSON object with filtered features
  return {
    ...data,
    features: filteredFeatures
  };
};