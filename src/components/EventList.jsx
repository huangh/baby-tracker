import React from 'react';

/**
 * EventList Component
 * Displays all events in reverse chronological order
 */
export default function EventList({ events, config }) {
  if (!events || events.length === 0) {
    return (
      <div className="event-list">
        <h2>Event History</h2>
        <p className="no-events">No events recorded yet.</p>
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return 'Unknown time';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString();
  };

  const getEventTypeLabel = (eventTypeId) => {
    if (!config || !config.events) return eventTypeId;
    const eventType = config.events.find(e => e.id === eventTypeId);
    return eventType ? eventType.label : eventTypeId;
  };

  const formatEventDetails = (event) => {
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
    
    return details;
  };

  // Sort events by timestamp (most recent first)
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return dateB - dateA;
  });

  return (
    <div className="event-list">
      <h2>Event History</h2>
      <div className="events-container">
        {sortedEvents.map((event, index) => (
          <div key={index} className="event-item">
            <div className="event-header">
              <span className="event-type">{getEventTypeLabel(event.eventType)}</span>
              <span className="event-time">{formatDate(event.timestamp)}</span>
            </div>
            {formatEventDetails(event).length > 0 && (
              <div className="event-details">
                {formatEventDetails(event).map((detail, i) => (
                  <span key={i} className="event-detail">{detail}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
