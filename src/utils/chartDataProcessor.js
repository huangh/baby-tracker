/**
 * Chart Data Processing Utilities
 * Functions for filtering and processing events for charts
 */

/**
 * Filter events to today only (strict calendar day: 00:00 to 23:59)
 * @param {Array} events - Array of event objects
 * @returns {Array} Filtered events from today
 */
export function filterTodayEvents(events) {
  if (!events || events.length === 0) return [];
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  return events.filter(event => {
    const timestamp = event.timestamp instanceof Date 
      ? event.timestamp 
      : new Date(event.timestamp);
    return timestamp >= todayStart && timestamp <= todayEnd;
  });
}

/**
 * Group events by day for the last 7 rolling days
 * @param {Array} events - Array of event objects
 * @returns {Array} Array of day objects with events and counts
 */
export function groupEventsByDay(events) {
  if (!events || events.length === 0) return [];
  
  const now = new Date();
  const days = [];
  
  // Create array for last 7 days (most recent first)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayEvents = events.filter(event => {
      const timestamp = event.timestamp instanceof Date 
        ? event.timestamp 
        : new Date(event.timestamp);
      return timestamp >= date && timestamp <= dayEnd;
    });
    
    const feeds = dayEvents.filter(e => e.eventType === 'feeding').length;
    const pees = dayEvents.filter(e => e.eventType === 'peeing').length;
    const poops = dayEvents.filter(e => e.eventType === 'pooping').length;
    
    days.push({
      date: date,
      dateKey: date.toISOString().split('T')[0],
      label: getDayLabel(date, i),
      feeds: feeds,
      pees: pees,
      poops: poops,
      events: dayEvents
    });
  }
  
  return days;
}

/**
 * Get a readable label for a day
 * @param {Date} date - Date object
 * @param {number} daysAgo - Days ago (0 = today)
 * @returns {string} Day label
 */
function getDayLabel(date, daysAgo) {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[date.getDay()];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${dayName} ${month}/${day}`;
}

/**
 * Get hour of day from timestamp (0-23)
 * @param {Date|string} timestamp - Event timestamp
 * @returns {number} Hour of day
 */
export function getHourOfDay(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.getHours() + date.getMinutes() / 60; // Include fractional hours
}

