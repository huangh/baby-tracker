import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { groupEventsByDay } from '../../utils/chartDataProcessor';

/**
 * WeeklySummaryChart Component
 * Bar chart showing feeds/pees/poops per day for last 7 days
 */
export default function WeeklySummaryChart({ events }) {
  const dailyData = useMemo(() => groupEventsByDay(events || []), [events]);
  
  const chartData = useMemo(() => {
    return dailyData.map(day => ({
      date: day.dateKey,
      label: day.label,
      Feeds: day.feeds,
      Pees: day.pees,
      Poops: day.poops
    }));
  }, [dailyData]);
  
  const formatTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p><strong>{label}</strong></p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  if (dailyData.length === 0) {
    return (
      <div className="weekly-summary-chart">
        <h2>Weekly Summary</h2>
        <p className="no-events">No events to display.</p>
      </div>
    );
  }
  
  return (
    <div className="weekly-summary-chart">
      <h2>Weekly Summary (Last 7 Days)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
          <XAxis 
            dataKey="label" 
            angle={-45}
            textAnchor="end"
            height={80}
            stroke="#5D5D5D"
          />
          <YAxis stroke="#5D5D5D" />
          <Tooltip content={formatTooltip} />
          <Legend />
          <Bar dataKey="Feeds" fill="#A8E6CF" name="Feeds" />
          <Bar dataKey="Pees" fill="#FFD3B6" name="Pees" />
          <Bar dataKey="Poops" fill="#B4A7D6" name="Poops" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

