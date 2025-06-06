import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from 'lucide-react';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangeFilterProps {
  onDateRangeChange: (dateRange: DateRange) => void;
  dateRange: DateRange;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onDateRangeChange, dateRange }) => {
  const [startDate, setStartDate] = useState<Date | null>(dateRange.startDate);
  const [endDate, setEndDate] = useState<Date | null>(dateRange.endDate);
  const [error, setError] = useState<string | null>(null);

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setError(null);
  };

  return (
    <div className="flex flex-col space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Filter Cleanup Events</h2>
      
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
      
      {error && (
        <div className="text-red-500 text-sm font-medium">{error}</div>
      )}
      
      <div className="flex justify-end">
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