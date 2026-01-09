import React, { useState, useEffect } from 'react';
import EventForm from './components/EventForm';
import EventList from './components/EventList';
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
        
        // If config exists in URL, use it; otherwise load from file
        let loadedConfig;
        if (urlState.config) {
          loadedConfig = urlState.config;
        } else {
          loadedConfig = await loadConfig();
        }
        
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

  // Sync state to URL whenever events or config changes
  useEffect(() => {
    if (config && events !== null) {
      // Convert Date objects to ISO strings for serialization
      const serializedEvents = events.map(event => ({
        ...event,
        timestamp: event.timestamp instanceof Date 
          ? event.timestamp.toISOString() 
          : event.timestamp
      }));
      
      updateUrlState(serializedEvents, config);
    }
  }, [events, config]);

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
      if (urlState.config) {
        setConfig(urlState.config);
      }
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
        <h1>Baby Event Tracker</h1>
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
    </div>
  );
}

export default App;
