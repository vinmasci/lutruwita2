import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface ElevationPoint {
  distance: number;
  elevation: number;
  grade: number;
  surface: string;
}

interface ElevationProfileProps {
  data: ElevationPoint[];
  visible: boolean;
}

const ElevationProfile = ({ data, visible }: ElevationProfileProps) => {
  const getGradeColor = (grade: number) => {
    if (grade >= 15) return "#000000"; // Black
    if (grade >= 12) return "#800000"; // Maroon
    if (grade >= 9) return "#FF0000";  // Red
    if (grade >= 6) return "#FFA500";  // Orange
    if (grade >= 3) return "#FFFF00";  // Yellow
    return "#00FF00";                  // Green
  };

  if (!visible) return null;

  return (
    <div className="absolute bottom-16 left-0 right-0 h-32 mx-4 bg-white rounded-t-lg shadow-lg">
      <div className="p-2 border-b">
        <span className="text-sm font-medium">Elevation Profile</span>
      </div>
      <div className="h-[calc(100%-2.5rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="distance" 
              label={{ value: 'Distance (km)', position: 'bottom' }}
              tickFormatter={(value) => `${value}km`}
            />
            <YAxis
              label={{ 
                value: 'Elevation (m)', 
                angle: -90, 
                position: 'left' 
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ElevationPoint;
                  return (
                    <div className="bg-white p-2 shadow rounded border">
                      <p className="text-sm">Distance: {data.distance}km</p>
                      <p className="text-sm">Elevation: {data.elevation}m</p>
                      <p className="text-sm">Grade: {data.grade}%</p>
                      <p className="text-sm">Surface: {data.surface}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="elevation"
              stroke="#4F46E5"
              fill="url(#gradientFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ElevationProfile;