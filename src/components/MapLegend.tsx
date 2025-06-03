import React from 'react';

const MapLegend: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-2 text-gray-800">Cleanup Priority</h3>
      <div className="space-y-2">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded mr-2" style={{ backgroundColor: '#EF4444' }}></div>
          <span className="text-sm">High Priority</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 rounded mr-2" style={{ backgroundColor: '#F59E0B' }}></div>
          <span className="text-sm">Medium Priority</span>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 rounded mr-2" style={{ backgroundColor: '#10B981' }}></div>
          <span className="text-sm">Low Priority</span>
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        <p>Hover over areas for more details</p>
      </div>
    </div>
  );
};

export default MapLegend;