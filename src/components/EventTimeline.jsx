import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

/**
 * EventTimeline Component
 * Displays a timeline plot of events with time on X-axis and rows for each category
 */
export default function EventTimeline({ events, config }) {
  const chartData = useMemo(() => {
    if (!events || !config || !config.events) return [];

    // Create a map of event types to their row positions and emojis
    const eventTypeMap = {};
    config.events.forEach((eventType, index) => {
      eventTypeMap[eventType.id] = {
        y: index,
        emoji: eventType.emoji || '●',
        label: eventType.label
      };
    });

    // Transform events into chart data points
    return events
      .map(event => {
        const timestamp = event.timestamp instanceof Date 
          ? event.timestamp 
          : new Date(event.timestamp);
        
        const eventTypeInfo = eventTypeMap[event.eventType];
        if (!eventTypeInfo) return null;

        return {
          x: timestamp.getTime(),
          y: eventTypeInfo.y,
          eventType: event.eventType,
          emoji: eventTypeInfo.emoji,
          label: eventTypeInfo.label,
          timestamp: timestamp,
          details: getEventDetails(event)
        };
      })
      .filter(point => point !== null)
      .sort((a, b) => a.x - b.x);
  }, [events, config]);

  const eventTypes = useMemo(() => {
    if (!config || !config.events) return [];
    return config.events.map((eventType, index) => ({
      y: index,
      emoji: eventType.emoji || '●',
      label: eventType.label,
      id: eventType.id
    }));
  }, [config]);

  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const dateStr = data.timestamp.toLocaleString();
      return (
        <div className="chart-tooltip">
          <p><strong>{data.emoji} {data.label}</strong></p>
          <p>{dateStr}</p>
          {data.details && <p>{data.details}</p>}
        </div>
      );
    }
    return null;
  };

  const CustomDot = ({ cx, cy, payload }) => {
    return (
      <text
        x={cx}
        y={cy}
        fontSize="20"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {payload.emoji}
      </text>
    );
  };

  if (!events || events.length === 0) {
    return (
      <div className="event-timeline">
        <h2>Event Timeline</h2>
        <p className="no-events">No events to display. Add some events to see them on the timeline!</p>
      </div>
    );
  }

  // Get time range for X-axis
  const times = chartData.map(d => d.x);
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timePadding = (maxTime - minTime) * 0.1 || 3600000; // 10% padding or 1 hour default

  return (
    <div className="event-timeline">
      <h2>Event Timeline</h2>
      <div className="timeline-container">
        <ResponsiveContainer width="100%" height={Math.max(200, eventTypes.length * 80)}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 40, left: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[minTime - timePadding, maxTime + timePadding]}
              tickFormatter={formatXAxis}
              label={{ value: 'Time', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[-0.5, eventTypes.length - 0.5]}
              tickFormatter={(value) => {
                const eventType = eventTypes.find(et => et.y === value);
                return eventType ? `${eventType.emoji} ${eventType.label}` : '';
              }}
              label={{ value: 'Event Type', angle: -90, position: 'insideLeft' }}
            />
            {eventTypes.map((eventType, index) => (
              <ReferenceLine
                key={eventType.id}
                y={index}
                stroke="#e0e0e0"
                strokeDasharray="3 3"
              />
            ))}
            <Tooltip content={formatTooltip} />
            <Scatter
              name="Events"
              data={chartData}
              fill="#8884d8"
              shape={<CustomDot />}
            />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="timeline-legend">
          {eventTypes.map((eventType) => (
            <div key={eventType.id} className="legend-item">
              <span className="legend-emoji">{eventType.emoji}</span>
              <span className="legend-label">{eventType.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Get event details as a string for tooltip
 */
function getEventDetails(event) {
  const details = [];
  
  if (event.type && event.eventType === 'feeding') {
    details.push(`Type: ${event.type}`);
  }
  if (event.amount !== undefined && event.amount !== null && event.amount !== '') {
    details.push(`Amount: ${event.amount} ml`);
  }
  if (event.consistency) {
    details.push(`Consistency: ${event.consistency}`);
  }
  
  return details.join(', ');
}
