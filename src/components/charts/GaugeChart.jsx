import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const GaugeChart = ({ value, max = 100, title, color = '#3B82F6', height = 250 }) => {
  const percentage = (value / max) * 100;
  const remaining = 100 - percentage;
  
  const data = [
    { name: 'Value', value: percentage, color: color },
    { name: 'Remaining', value: remaining, color: '#E5E7EB' }
  ];

  const getStatusColor = (percentage) => {
    if (percentage >= 80) return '#10B981'; // Green
    if (percentage >= 60) return '#F59E0B'; // Yellow
    if (percentage >= 40) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              startAngle={90}
              endAngle={450}
              paddingAngle={0}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: getStatusColor(percentage) }}>
              {value}
            </div>
            <div className="text-sm text-gray-500">of {max}</div>
            <div className="text-lg font-semibold" style={{ color: getStatusColor(percentage) }}>
              {percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GaugeChart;
