import React from 'react';
import { Droplets, Trees as Tree, Trash2, Leaf, Flower2 } from 'lucide-react';

const MapLegend: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Legend</h3>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Event Types</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded mr-2" style={{ backgroundColor: '#10b981', border: '2px solid #047857' }}></div>
              <span className="text-sm">Tree Planting Location</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded mr-2" style={{ backgroundColor: '#3b82f6', border: '2px solid #1d4ed8' }}></div>
              <span className="text-sm">Environmental Cleanup Site</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded mr-2" style={{ backgroundColor: '#f59e0b', border: '2px solid #b45309' }}></div>
              <span className="text-sm">Community Garden</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Categories</h3>
          <div className="space-y-2">
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
            <div className="flex items-center">
              <Flower2 className="w-5 h-5 mr-2 text-amber-600" />
              <span className="text-sm">Community Garden</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Click on areas for detailed information about specific sites
        </p>
      </div>
    </div>
  );
};

export default MapLegend;