/**
 * Data Compression Utilities
 * Compress old events into summary data (counts per day)
 */

/**
 * Check if a date is "recent" (today or yesterday)
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is recent
 */
function isRecentDate(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return checkDate >= yesterday;
}

/**
 * Get date key for grouping (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} Date key
 */
function getDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Compress events: keep full data for recent days, summarize older days
 * @param {Array} events - Array of events
 * @returns {Object} Compressed data structure {recent: [...], summaries: [...]}
 */
export function compressEvents(events) {
  const recent = [];
  const summariesByDate = {};
  
  for (const event of events) {
    let timestamp;
    if (event.timestamp instanceof Date) {
      timestamp = event.timestamp;
    } else if (typeof event.timestamp === 'number') {
      // Check if it's Unix timestamp (seconds) or milliseconds
      if (event.timestamp < 10000000000) {
        // Unix timestamp in seconds - convert to Date
        timestamp = new Date(event.timestamp * 1000);
      } else {
        // Milliseconds timestamp
        timestamp = new Date(event.timestamp);
      }
    } else {
      timestamp = new Date(event.timestamp);
    }
    
    if (isRecentDate(timestamp)) {
      // Keep full event data for recent days
      recent.push(event);
    } else {
      // Summarize old events by date
      const dateKey = getDateKey(timestamp);
      if (!summariesByDate[dateKey]) {
        summariesByDate[dateKey] = {
          date: dateKey,
          feeds: 0,
          pees: 0,
          poops: 0
        };
      }
      
      const summary = summariesByDate[dateKey];
      if (event.eventType === 'feeding') {
        summary.feeds++;
      } else if (event.eventType === 'peeing') {
        summary.pees++;
      } else if (event.eventType === 'pooping') {
        summary.poops++;
      }
    }
  }
  
  const summaries = Object.values(summariesByDate);
  
  return {
    recent: recent,
    summaries: summaries
  };
}

/**
 * Decompress data: expand summaries back to individual events (for display purposes)
 * Note: This creates approximate events - original timestamps are lost
 * @param {Object} compressed - Compressed data structure
 * @returns {Array} Array of events (recent + reconstructed from summaries)
 */
export function decompressEvents(compressed) {
  const events = [...compressed.recent];
  
  // Expand summaries back to events (with approximate timestamps)
  for (const summary of compressed.summaries || []) {
    const date = new Date(summary.date + 'T12:00:00Z'); // Use noon as approximate time
    
    // Create approximate events for summaries
    for (let i = 0; i < summary.feeds; i++) {
      events.push({
        eventType: 'feeding',
        timestamp: new Date(date.getTime() + i * 3600000), // Space them 1 hour apart
        _fromSummary: true
      });
    }
    
    for (let i = 0; i < summary.pees; i++) {
      events.push({
        eventType: 'peeing',
        timestamp: new Date(date.getTime() + i * 7200000), // Space them 2 hours apart
        _fromSummary: true
      });
    }
    
    for (let i = 0; i < summary.poops; i++) {
      events.push({
        eventType: 'pooping',
        timestamp: new Date(date.getTime() + i * 10800000), // Space them 3 hours apart
        _fromSummary: true
      });
    }
  }
  
  // Sort by timestamp
  return events.sort((a, b) => {
    const tsA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const tsB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return tsA - tsB;
  });
}

/**
 * Merge compressed data with new events
 * @param {Object} compressed - Existing compressed data
 * @param {Array} newEvents - New events to add
 * @returns {Object} Updated compressed data
 */
export function mergeCompressedEvents(compressed, newEvents) {
  const allRecent = [...(compressed.recent || []), ...newEvents];
  const compressedResult = compressEvents(allRecent);
  
  return {
    recent: compressedResult.recent,
    summaries: [...(compressed.summaries || []), ...compressedResult.summaries]
  };
}

