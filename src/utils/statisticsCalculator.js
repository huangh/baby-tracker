/**
 * Statistics Calculator Utilities
 * Extensible structure for calculating statistics on event data
 */

/**
 * Calculate average time between feeding events
 * @param {Array} events - Array of event objects
 * @returns {Object} Statistics object with averageTime (in minutes) and formatted string
 */
export function calculateAverageTimeBetweenFeeds(events) {
  const feedingEvents = (events || [])
    .filter(event => event.eventType === 'feeding')
    .map(event => ({
      timestamp: event.timestamp instanceof Date 
        ? event.timestamp 
        : new Date(event.timestamp)
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
  
  if (feedingEvents.length < 2) {
    return {
      averageMinutes: null,
      formatted: 'N/A (need at least 2 feeds)'
    };
  }
  
  const timeDifferences = [];
  for (let i = 1; i < feedingEvents.length; i++) {
    const diff = feedingEvents[i].timestamp - feedingEvents[i - 1].timestamp;
    const minutes = diff / (1000 * 60);
    timeDifferences.push(minutes);
  }
  
  const averageMinutes = timeDifferences.reduce((sum, val) => sum + val, 0) / timeDifferences.length;
  
  return {
    averageMinutes: averageMinutes,
    formatted: formatTimeInterval(averageMinutes)
  };
}

/**
 * Format time interval in minutes to human-readable string
 * @param {number} minutes - Time in minutes
 * @returns {string} Formatted string (e.g., "2h 30m" or "45m")
 */
function formatTimeInterval(minutes) {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}m`;
}

/**
 * Calculate statistics for events (extensible structure)
 * @param {Array} events - Array of event objects
 * @returns {Object} Statistics object with various calculated metrics
 */
export function calculateStatistics(events) {
  return {
    averageTimeBetweenFeeds: calculateAverageTimeBetweenFeeds(events),
    // Add more statistics here as needed
  };
}

