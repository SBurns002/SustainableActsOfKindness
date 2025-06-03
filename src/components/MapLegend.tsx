import React from 'react';
import { AlertTriangle, Droplets, Factory, Tree, Trash2 } from 'lucide-react';

const MapLegend: React.FC = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg max-w-xs">
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

      <div>
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Pollution Types</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <Droplets className="w-5 h-5 mr-2 text-blue-600" />
            <span className="text-sm">Water Pollution</span>
          </div>
          <div className="flex items-center">
            <Factory className="w-5 h-5 mr-2 text-gray-600" />
            <span className="text-sm">Industrial Contamination</span>
          </div>
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
            <span className="text-sm">Chemical/Hazardous Waste</span>
          </div>
          <div className="flex items-center">
            <Tree className="w-5 h-5 mr-2 text-green-600" />
            <span className="text-sm">Habitat Restoration</span>
          </div>
          <div className="flex items-center">
            <Trash2 className="w-5 h-5 mr-2 text-purple-600" />
            <span className="text-sm">General Waste</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Click on areas for detailed information about specific cleanup sites
        </p>
      </div>
    </div>
  );
};

export default MapLegend;