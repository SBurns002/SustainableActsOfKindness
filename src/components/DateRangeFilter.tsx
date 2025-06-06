import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Filter } from 'lucide-react';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangeFilterProps {
  onDateRangeChange: (dateRange: DateRange) => void;
  onEventTypeChange: (eventTypes: string[]) => void;
  dateRange: DateRange;
  selectedEventTypes: string[];
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ 
  onDateRangeChange, 
  onEventTypeChange, 
  dateRange, 
  selectedEventTypes 
}) => {
  const [startDate, setStartDate] = useState<Date | null>(dateRange.startDate);
  const [endDate, setEndDate] = useState<Date | null>(dateRange.endDate);
  const [error, setError] = useState<string | null>(null);

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventTypes = [
    { value: 'cleanup', label: 'Environmental Cleanup', color: '#3b82f6' },
    { value: 'treePlanting', label: 'Tree Planting', color: '#10b981' },
    { value: 'garden', label: 'Community Garden', color: '#f59e0b' }
  ];

  useEffect(() => {
    if (startDate && endDate && startDate > endDate) {
      setError('End date cannot be before start date');
    } else {
      setError(null);
      onDateRangeChange({ startDate, endDate });
    }
  }, [startDate, endDate, onDateRangeChange]);

  const handleStartDateChange = (date: Date | null) => {
    if (date && date < today) {
      setError('Start date cannot be in the past');
      return;
    }
    setStartDate(date);
  };

  const handleEventTypeToggle = (eventType: string) => {
    const updatedTypes = selectedEventTypes.includes(eventType)
      ? selectedEventTypes.filter(type => type !== eventType)
      : [...selectedEventTypes, eventType];
    
    onEventTypeChange(updatedTypes);
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setError(null);
    onEventTypeChange([]);
  };

  return (
    <div className="flex flex-col space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 text-center">Filter Cleanup Events</h2>
      
      {/* Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
        <div className="flex flex-col flex-1">
          <label htmlFor="start-date" className="mb-1 text-sm font-medium text-gray-700 flex items-center">
            <Calendar className="w-4 h-4 mr-1" /> Start Date
          </label>
          <DatePicker
            id="start-date"
            selected={startDate}
            onChange={handleStartDateChange}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            minDate={today}
            placeholderText="Select start date"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            dateFormat="MM/dd/yyyy"
          />
        </div>
        
        <div className="flex flex-col flex-1">
          <label htmlFor="end-date" className="mb-1 text-sm font-medium text-gray-700 flex items-center">
            <Calendar className="w-4 h-4 mr-1" /> End Date
          </label>
          <DatePicker
            id="end-date"
            selected={endDate}
            onChange={setEndDate}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate || today}
            placeholderText="Select end date"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            dateFormat="MM/dd/yyyy"
          />
        </div>
      </div>

      {/* Event Type Filter */}
      <div className="flex flex-col">
        <label className="mb-2 text-sm font-medium text-gray-700 flex items-center">
          <Filter className="w-4 h-4 mr-1" /> Event Types
        </label>
        <div className="flex flex-wrap gap-2">
          {eventTypes.map((eventType) => (
            <button
              key={eventType.value}
              onClick={() => handleEventTypeToggle(eventType.value)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                selectedEventTypes.includes(eventType.value)
                  ? 'text-white shadow-md transform scale-105'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: selectedEventTypes.includes(eventType.value) ? eventType.color : undefined
              }}
            >
              <div 
                className="w-3 h-3 rounded-full border-2"
                style={{ 
                  backgroundColor: selectedEventTypes.includes(eventType.value) ? 'white' : eventType.color,
                  borderColor: selectedEventTypes.includes(eventType.value) ? 'white' : eventType.color
                }}
              />
              <span>{eventType.label}</span>
            </button>
          ))}
        </div>
        {selectedEventTypes.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">Select event types to filter (showing all by default)</p>
        )}
      </div>
      
      {error && (
        <div className="text-red-500 text-sm font-medium">{error}</div>
      )}
      
      <div className="flex justify-center">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default DateRangeFilter;