import React, { useState } from 'react';
import { Droplets, Trees as Tree, Trash2, ChevronUp, ChevronDown, Leaf, Recycle } from 'lucide-react';

const MapLegend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`bg-white rounded-lg shadow-lg transition-all duration-300 cursor-pointer ${
        isExpanded ? 'p-4' : 'p-2'
      }`}
      onClick={toggleExpand}
    >
      {isExpanded ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Legend</h3>
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Cleanup Priority</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded mr-2" style={{ backgroundColor: '#EF4444' }}></div>
                <span className="text-sm">High Priority - Immediate Action Required</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 rounded mr-2" style={{ backgroundColor: '#F59E0B' }}></div>
                <span className="text-sm">Medium Priority - Planned Intervention</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 rounded mr-2" style={{ backgroundColor: '#10B981' }}></div>
                <span className="text-sm">Low Priority - Monitoring</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Tree Planting Events</h3>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded mr-2" style={{ backgroundColor: '#059669', border: '2px solid #065f46' }}></div>
              <span className="text-sm">Tree Planting Location</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Environmental Cleanup</h3>
            <div className="flex items-center space-x-2 mb-2">
              <Recycle className="w-5 h-5 text-emerald-600" />
              <span className="text-sm">General Environmental Cleanup</span>
            </div>
            <div className="space-y-2 pl-7">
              <div className="text-sm text-gray-600">Types of Cleanup:</div>
              <div className="flex items-center">
                <Droplets className="w-5 h-5 mr-2 text-blue-600" />
                <span className="text-sm">Water Pollution</span>
              </div>
              <div className="flex items-center">
                <Tree className="w-5 h-5 mr-2 text-green-600" />
                <span className="text-sm">Habitat Restoration</span>
              </div>
              <div className="flex items-center">
                <Trash2 className="w-5 h-5 mr-2 text-purple-600" />
                <span className="text-sm">General Waste</span>
              </div>
              <div className="flex items-center">
                <Leaf className="w-5 h-5 mr-2 text-emerald-600" />
                <span className="text-sm">Tree Planting</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Click on areas for detailed information about specific sites
            </p>
          </div>
        </>
      ) : (
        <div className="flex items-center">
          <div className="flex space-x-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }}></div>
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }}></div>
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }}></div>
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#059669', border: '1px solid #065f46' }}></div>
          </div>
          <ChevronUp className="w-5 h-5 text-gray-600 ml-2" />
        </div>
      )}
    </div>
  );
};

export default MapLegend;