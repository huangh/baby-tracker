import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Brush } from 'recharts';

/**
 * EventTimeline Component
 * Displays a timeline plot of events with time on X-axis and rows for each category
 * Supports zooming and separate rows for feeding subcategories
 */
export default function EventTimeline({ events, config }) {
  const [xDomain, setXDomain] = useState(null);
  const timelineContainerRef = useRef(null);

  // Build list of all categories (including feeding subcategories)
  const allCategories = useMemo(() => {
    if (!config || !config.events) return [];
    
    const categories = [];
    config.events.forEach((eventType) => {
      // If event type has categories (like feeding with breastmilk/formula/bottle)
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
        // Regular event type without subcategories
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

  // Create map for quick lookup
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

  const chartData = useMemo(() => {
    if (!events || events.length === 0) return [];

    // Transform events into chart data points
    const points = events
      .map(event => {
        const timestamp = event.timestamp instanceof Date 
          ? event.timestamp 
          : new Date(event.timestamp);
        
        // Handle feeding events with subcategories
        let categoryKey;
        if (event.eventType === 'feeding' && event.type) {
          categoryKey = `feeding:${event.type}`;
        } else {
          categoryKey = event.eventType;
        }
        
        const categoryInfo = categoryMap[categoryKey];
        if (!categoryInfo) {
          // Fallback: try just the event type (for non-feeding events or if category not found)
          const fallbackKey = event.eventType;
          const fallbackInfo = categoryMap[fallbackKey];
          if (!fallbackInfo) {
            // Last resort: create a generic entry
            console.warn('Unknown event type/category:', event.eventType, event.type);
            return {
              x: timestamp.getTime(),
              y: 0, // Place at top temporarily
              eventType: event.eventType,
              category: event.type || null,
              emoji: '●',
              label: event.eventType,
              fullLabel: event.eventType,
              timestamp: timestamp,
              details: getEventDetails(event),
              _warning: true
            };
          }
          // Use fallback for non-feeding events or missing feeding subcategories
          return {
            x: timestamp.getTime(),
            y: fallbackInfo.y,
            eventType: event.eventType,
            category: event.type || null,
            emoji: fallbackInfo.emoji,
            label: fallbackInfo.label,
            fullLabel: fallbackInfo.fullLabel,
            timestamp: timestamp,
            details: getEventDetails(event)
          };
        }

        return {
          x: timestamp.getTime(),
          y: categoryInfo.y,
          eventType: event.eventType,
          category: event.type || null,
          emoji: categoryInfo.emoji,
          label: categoryInfo.label,
          fullLabel: categoryInfo.fullLabel,
          timestamp: timestamp,
          details: getEventDetails(event)
        };
      })
      .filter(point => point !== null);
    
    return points.sort((a, b) => a.x - b.x);
  }, [events, categoryMap]);

  // Get sorted data for brush - must be before any conditional returns
  // Filter out invalid data points
  const sortedDataForBrush = useMemo(() => {
    return [...chartData]
      .filter(d => d && !isNaN(d.x) && isFinite(d.x))
      .sort((a, b) => a.x - b.x);
  }, [chartData]);

  // Calculate time range and domain - must be before conditional returns
  const timeRangeData = useMemo(() => {
    const times = chartData.map(d => d.x).filter(t => !isNaN(t) && isFinite(t));
    if (times.length === 0) {
      return { valid: false, minTime: null, maxTime: null, defaultDomain: null };
    }
    
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    if (isNaN(minTime) || isNaN(maxTime) || !isFinite(minTime) || !isFinite(maxTime)) {
      return { valid: false, minTime: null, maxTime: null, defaultDomain: null };
    }
    
    const timeRange = maxTime - minTime;
    const timePadding = timeRange > 0 ? timeRange * 0.05 : 3600000;
    
    const defaultDomainMin = minTime - timePadding;
    const defaultDomainMax = maxTime + timePadding;
    const defaultDomain = [
      isNaN(defaultDomainMin) || !isFinite(defaultDomainMin) ? minTime : defaultDomainMin,
      isNaN(defaultDomainMax) || !isFinite(defaultDomainMax) ? maxTime : defaultDomainMax
    ];
    
    return { valid: true, minTime, maxTime, defaultDomain };
  }, [chartData]);

  // Mouse wheel zoom handler - must be before conditional returns
  useEffect(() => {
    const container = timelineContainerRef.current;
    if (!container || !timeRangeData.valid) return;

    const handleWheel = (e) => {
      // Only zoom if Ctrl/Cmd key is held (standard zoom behavior)
      if (!e.ctrlKey && !e.metaKey) return;
      
      e.preventDefault();
      
      // Use current domain state or compute default
      const domain = xDomain || timeRangeData.defaultDomain;
      if (!domain || domain.length !== 2) return;
      
      const [currentStart, currentEnd] = domain;
      
      // Get mouse position relative to chart
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const mousePosition = Math.max(0, Math.min(1, x / width)); // Clamp 0 to 1
      
      const currentRange = currentEnd - currentStart;
      
      // Calculate zoom factor (positive = zoom in, negative = zoom out)
      const zoomFactor = -e.deltaY * 0.001; // Adjust sensitivity
      const newRange = currentRange * (1 + zoomFactor);
      
      // Clamp zoom range (min 1 hour, max 30 days)
      const minRange = 3600000; // 1 hour
      const maxRange = 30 * 24 * 3600000; // 30 days
      const clampedRange = Math.max(minRange, Math.min(maxRange, newRange));
      
      // Maintain zoom center at mouse position
      const zoomCenter = currentStart + currentRange * mousePosition;
      const newStart = zoomCenter - clampedRange * mousePosition;
      const newEnd = zoomCenter + clampedRange * (1 - mousePosition);
      
      // Ensure we don't go outside the data bounds
      const clampedStart = Math.max(timeRangeData.minTime, Math.min(newStart, timeRangeData.maxTime));
      const clampedEnd = Math.max(timeRangeData.minTime, Math.min(newEnd, timeRangeData.maxTime));
      
      if (!isNaN(clampedStart) && !isNaN(clampedEnd) && isFinite(clampedStart) && isFinite(clampedEnd)) {
        setXDomain([clampedStart, clampedEnd]);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [xDomain, timeRangeData]);

  const formatXAxis = (tickItem) => {
    if (typeof tickItem !== 'number') return '';
    const date = new Date(tickItem);
    // Show date and time for better readability
    const isToday = new Date().toDateString() === date.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    }
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
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
          <p><strong>{data.emoji} {data.fullLabel}</strong></p>
          <p>{dateStr}</p>
          {data.details && <p>{data.details}</p>}
        </div>
      );
    }
    return null;
  };

  const CustomDot = ({ cx, cy, payload }) => {
    if (!cx || !cy) return null;
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

  // Early returns after all hooks
  if (!timeRangeData.valid) {
    return (
      <div className="event-timeline">
        <h2>Event Timeline</h2>
        <p className="no-events">No valid events to display.</p>
      </div>
    );
  }
  
  const { minTime, maxTime, defaultDomain } = timeRangeData;
  
  // Use brush domain if set and valid, otherwise use full range
  let currentDomain = defaultDomain;
  if (xDomain && Array.isArray(xDomain) && xDomain.length === 2) {
    const [start, end] = xDomain;
    if (!isNaN(start) && !isNaN(end) && isFinite(start) && isFinite(end) && start < end) {
      currentDomain = xDomain;
    }
  }

  return (
    <div className="event-timeline">
      <div className="timeline-header">
        <h2>Event Timeline</h2>
        {xDomain && (
          <button 
            className="reset-zoom-button"
            onClick={() => setXDomain(null)}
            title="Reset zoom"
          >
            🔍 Reset Zoom
          </button>
        )}
      </div>
      <div className="timeline-container" ref={timelineContainerRef}>
        <ResponsiveContainer width="100%" height={Math.max(300, allCategories.length * 60 + 100)}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 60, left: 100 }}
            data={chartData}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              domain={currentDomain}
              tickFormatter={formatXAxis}
              label={{ value: 'Time', position: 'insideBottom', offset: -10 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[-0.5, allCategories.length - 0.5]}
              tickFormatter={(value) => {
                const category = allCategories.find(cat => cat.y === value);
                return category ? `${category.emoji} ${category.label}` : '';
              }}
              width={90}
            />
            {allCategories.map((category) => (
              <ReferenceLine
                key={`${category.eventTypeId}-${category.categoryId || 'main'}`}
                y={category.y}
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
            {sortedDataForBrush.length > 0 && (
              <Brush
                dataKey="x"
                height={30}
                stroke="#8884d8"
                fill="#8884d8"
                tickFormatter={formatXAxis}
                data={sortedDataForBrush}
                startIndex={0}
                endIndex={Math.max(0, sortedDataForBrush.length - 1)}
                onChange={(domain) => {
                  if (domain && typeof domain.startIndex === 'number' && typeof domain.endIndex === 'number') {
                    const startIndex = Math.max(0, Math.min(domain.startIndex, sortedDataForBrush.length - 1));
                    const endIndex = Math.max(0, Math.min(domain.endIndex, sortedDataForBrush.length - 1));
                    const startTime = sortedDataForBrush[startIndex]?.x;
                    const endTime = sortedDataForBrush[endIndex]?.x;
                    if (startTime !== undefined && endTime !== undefined && 
                        !isNaN(startTime) && !isNaN(endTime) &&
                        isFinite(startTime) && isFinite(endTime)) {
                      setXDomain([Math.min(startTime, endTime), Math.max(startTime, endTime)]);
                    }
                  } else if (domain && Array.isArray(domain) && domain.length === 2) {
                    // Handle direct domain array
                    const [start, end] = domain;
                    if (!isNaN(start) && !isNaN(end) && isFinite(start) && isFinite(end)) {
                      setXDomain([Math.min(start, end), Math.max(start, end)]);
                    }
                  } else {
                    setXDomain(null);
                  }
                }}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
        <div className="timeline-legend">
          {allCategories.map((category) => (
            <div key={`${category.eventTypeId}-${category.categoryId || 'main'}`} className="legend-item">
              <span className="legend-emoji">{category.emoji}</span>
              <span className="legend-label">{category.fullLabel}</span>
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