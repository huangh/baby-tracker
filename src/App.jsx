import React, { useState, useEffect } from 'react';
import EventForm from './components/EventForm';
import EventList from './components/EventList';
import EventTimeline from './components/EventTimeline';
import CopyUrlButton from './components/CopyUrlButton';
import { loadConfig, getEventTypeConfig } from './utils/configLoader';
import { getStateFromUrl, updateUrlState } from './utils/urlState';

function App() {
  const [config, setConfig] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventType, setSelectedEventType] = useState('feeding');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize app: load config and state from URL
  useEffect(() => {
    const initialize = async () => {
      try {
        // First, try to get state from URL
        const urlState = getStateFromUrl();
        
        // Always load config from YAML file (don't store in URL)
        const loadedConfig = await loadConfig();
        
        setConfig(loadedConfig);
        // Convert ISO strings back to Date objects when loading from URL
        const deserializedEvents = (urlState.data || []).map(event => ({
          ...event,
          timestamp: event.timestamp ? new Date(event.timestamp) : new Date()
        }));
        setEvents(deserializedEvents);
        setLoading(false);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Sync state to URL whenever events change
  // Don't store config in URL - it's loaded from YAML file
  useEffect(() => {
    if (events !== null) {
      // Convert Date objects to ISO strings for serialization
      const serializedEvents = events.map(event => ({
        ...event,
        timestamp: event.timestamp instanceof Date 
          ? event.timestamp.toISOString() 
          : event.timestamp
      }));
      
      // Only store events in URL, not config (config comes from YAML)
      updateUrlState(serializedEvents, null);
    }
  }, [events]);

  // Listen for hash changes (back/forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const urlState = getStateFromUrl();
      if (urlState.data) {
        // Convert ISO strings back to Date objects
        const deserializedEvents = urlState.data.map(event => ({
          ...event,
          timestamp: event.timestamp ? new Date(event.timestamp) : new Date()
        }));
        setEvents(deserializedEvents);
      }
      // Config is always loaded from YAML, not from URL
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleEventSubmit = (eventData) => {
    const newEvent = {
      ...eventData,
      id: Date.now(), // Simple ID generation
      timestamp: eventData.timestamp instanceof Date 
        ? eventData.timestamp 
        : new Date(eventData.timestamp)
    };
    
    setEvents(prev => [...prev, newEvent]);
  };

  const getCurrentEventTypeConfig = () => {
    if (!config) return null;
    return getEventTypeConfig(config, selectedEventType);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="app">
        <div className="error">No configuration available</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-top">
          <h1>Baby Event Tracker</h1>
          <CopyUrlButton />
        </div>
        <div className="event-type-selector">
          <label htmlFor="event-type">Event Type: </label>
          <select
            id="event-type"
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
          >
            {config.events.map(event => (
              <option key={event.id} value={event.id}>
                {event.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="app-main">
        <div className="form-section">
          <EventForm
            eventTypeConfig={getCurrentEventTypeConfig()}
            onSubmit={handleEventSubmit}
          />
        </div>

        <div className="list-section">
          <EventList events={events} config={config} />
        </div>
      </main>

      <div className="timeline-section">
        <EventTimeline events={events} config={config} />
      </div>
    </div>
  );
}

export default App;
