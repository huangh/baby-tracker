import React, { useMemo } from 'react';
import { ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { filterTodayEvents } from '../../utils/chartDataProcessor';
import { calculateQuadraticRegression, generateTrendLinePoints } from '../../utils/polynomialRegression';

/**
 * DailyTimelineChart Component
 * 24-hour timeline showing events and milk amounts with quadratic trend line
 */
export default function DailyTimelineChart({ events, config }) {
  const todayEvents = useMemo(() => filterTodayEvents(events || []), [events]);
  
  // Build category map
  const allCategories = useMemo(() => {
    if (!config || !config.events) return [];
    
    const categories = [];
    config.events.forEach((eventType) => {
      if (eventType.categories && eventType.categories.length > 0) {
        eventType.categories.forEach((category) => {
          categories.push({
            y: categories.length,
            emoji: category.emoji || eventType.emoji || '●',
            label: category.label,
            eventTypeId: eventType.id,
            categoryId: category.id,
            fullLabel: `${eventType.label}: ${category.label}`
          });
        });
      } else {
        categories.push({
          y: categories.length,
          emoji: eventType.emoji || '●',
          label: eventType.label,
          eventTypeId: eventType.id,
          categoryId: null,
          fullLabel: eventType.label
        });
      }
    });
    return categories;
  }, [config]);
  
  const categoryMap = useMemo(() => {
    const map = {};
    allCategories.forEach((cat) => {
      const key = cat.categoryId 
        ? `${cat.eventTypeId}:${cat.categoryId}`
        : cat.eventTypeId;
      map[key] = cat;
    });
    return map;
  }, [allCategories]);
  
  // Process events for scatter plot
  const scatterData = useMemo(() => {
    return todayEvents
      .map(event => {
        const timestamp = event.timestamp instanceof Date 
          ? event.timestamp 
          : new Date(event.timestamp);
        
        let categoryKey;
        if (event.eventType === 'feeding' && event.type) {
          categoryKey = `feeding:${event.type}`;
        } else {
          categoryKey = event.eventType;
        }
        
        const categoryInfo = categoryMap[categoryKey] || categoryMap[event.eventType];
        if (!categoryInfo) return null;
        
        const hourOfDay = timestamp.getHours() + timestamp.getMinutes() / 60;
        
        return {
          x: hourOfDay,
          y: categoryInfo.y,
          eventType: event.eventType,
          category: event.type || null,
          emoji: categoryInfo.emoji,
          label: categoryInfo.fullLabel,
          timestamp: timestamp,
          amount: event.amount || null
        };
      })
      .filter(point => point !== null)
      .sort((a, b) => a.x - b.x);
  }, [todayEvents, categoryMap]);
  
  // Process feeding events for milk amount line
  const milkData = useMemo(() => {
    const feedingEvents = todayEvents
      .filter(event => event.eventType === 'feeding' && event.amount != null)
      .map(event => {
        const timestamp = event.timestamp instanceof Date 
          ? event.timestamp 
          : new Date(event.timestamp);
        const hourOfDay = timestamp.getHours() + timestamp.getMinutes() / 60;
        return {
          x: hourOfDay,
          y: parseFloat(event.amount)
        };
      })
      .sort((a, b) => a.x - b.x);
    
    return feedingEvents;
  }, [todayEvents]);
  
  // Calculate quadratic regression for milk amounts
  const trendLineData = useMemo(() => {
    if (milkData.length < 3) return []; // Need at least 3 points
    
    const coefficients = calculateQuadraticRegression(milkData);
    if (!coefficients) return [];
    
    const minX = Math.min(...milkData.map(d => d.x));
    const maxX = Math.max(...milkData.map(d => d.x));
    
    return generateTrendLinePoints(minX, maxX, coefficients, 50);
  }, [milkData]);
  
  const maxMilkAmount = useMemo(() => {
    if (milkData.length === 0) return 100;
    return Math.max(...milkData.map(d => d.y)) * 1.1; // 10% padding
  }, [milkData]);
  
  const formatXAxis = (value) => {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  const formatYAxisLeft = (value) => {
    const category = allCategories.find(cat => cat.y === value);
    return category ? `${category.emoji} ${category.label}` : '';
  };
  
  const CustomDot = ({ cx, cy, payload }) => {
    if (!cx || !cy) return null;
    return (
      <text
        x={cx}
        y={cy}
        fontSize="18"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {payload.emoji}
      </text>
    );
  };
  
  const formatTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.timestamp) {
        // Event marker
        const dateStr = data.timestamp.toLocaleString();
        return (
          <div className="chart-tooltip">
            <p><strong>{data.emoji} {data.label}</strong></p>
            <p>{dateStr}</p>
            {data.amount && <p>Amount: {data.amount} ml</p>}
          </div>
        );
      }
    }
    return null;
  };
  
  if (todayEvents.length === 0) {
    return (
      <div className="daily-timeline-chart">
        <h2>Today's Timeline</h2>
        <p className="no-events">No events today. Add some events to see them on the timeline!</p>
      </div>
    );
  }
  
  return (
    <div className="daily-timeline-chart">
      <h2>Today's Timeline</h2>
      <ResponsiveContainer width="100%" height={Math.max(300, allCategories.length * 60 + 100)}>
        <ComposedChart
          margin={{ top: 20, right: 40, bottom: 40, left: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E8" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 24]}
            tickFormatter={formatXAxis}
            label={{ value: 'Time', position: 'insideBottom', offset: -10 }}
            stroke="#5D5D5D"
          />
          <YAxis
            yAxisId="events"
            type="number"
            dataKey="y"
            domain={[-0.5, allCategories.length - 0.5]}
            tickFormatter={formatYAxisLeft}
            label={{ value: 'Events', angle: -90, position: 'insideLeft' }}
            stroke="#5D5D5D"
            width={90}
          />
          <YAxis
            yAxisId="milk"
            orientation="right"
            type="number"
            domain={[0, maxMilkAmount]}
            label={{ value: 'Milk Amount (ml)', angle: 90, position: 'insideRight' }}
            stroke="#5D5D5D"
            width={80}
          />
          <Tooltip content={formatTooltip} />
          <Legend />
          <Scatter
            yAxisId="events"
            name="Events"
            data={scatterData}
            fill="#B4A7D6"
            shape={<CustomDot />}
          />
          {milkData.length > 0 && (
            <>
              <Line
                yAxisId="milk"
                type="monotone"
                dataKey="y"
                data={milkData}
                stroke="#B8D4F0"
                strokeWidth={2}
                dot={{ fill: '#B8D4F0', r: 4 }}
                name="Milk Amount"
                connectNulls
              />
            </>
          )}
          {trendLineData.length > 0 && (
            <Line
              yAxisId="milk"
              type="monotone"
              dataKey="y"
              data={trendLineData}
              stroke="#8B9DC3"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Trend Line"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

