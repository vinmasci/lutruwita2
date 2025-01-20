import React from 'react';
import { cn } from '@/lib/utils';

interface SurfaceLegendProps {
  surfaces: { surface: string; distance: number }[];
  className?: string;
}

const surfaceColors = {
  paved: '#3498db',      // Blue for paved roads
  unpaved: '#e67e22',    // Orange for unpaved/gravel
  unknown: '#95a5a6'     // Gray for unknown
};

const SurfaceLegend: React.FC<SurfaceLegendProps> = ({ surfaces, className }) => {
  // Calculate total distance
  const totalDistance = surfaces.reduce((sum, s) => sum + s.distance, 0);
  
  // Group surfaces and calculate percentages
  const surfaceStats = surfaces.reduce((acc, { surface, distance }) => {
    if (!acc[surface]) {
      acc[surface] = { distance: 0, percentage: 0 };
    }
    acc[surface].distance += distance;
    acc[surface].percentage = (acc[surface].distance / totalDistance) * 100;
    return acc;
  }, {} as Record<string, { distance: number; percentage: number }>);

  return (
    <div className={cn("absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-md z-10", className)}>
      <h3 className="text-sm font-semibold mb-2">Surface Types</h3>
      <div className="space-y-2">
        {Object.entries(surfaceStats).map(([surface, stats]) => (
          <div key={surface} className="flex items-center gap-2 text-sm">
            <div 
              className="w-4 h-4 rounded"
              style={{ 
                backgroundColor: surfaceColors[surface as keyof typeof surfaceColors] || surfaceColors.unknown
              }} 
            />
            <span className="capitalize">{surface}</span>
            <span className="text-gray-500 text-xs">
              ({stats.percentage.toFixed(1)}% • {(stats.distance / 1000).toFixed(1)}km)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SurfaceLegend;
