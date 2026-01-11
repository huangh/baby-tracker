import React, { useState, useEffect } from 'react';
import EventForm from './components/EventForm';
import EventList from './components/EventList';
import DailyTimelineChart from './components/charts/DailyTimelineChart';
import WeeklySummaryChart from './components/charts/WeeklySummaryChart';
import StatisticsModule from './components/statistics/StatisticsModule';
import JsonEditor from './components/JsonEditor';
import CopyUrlButton from './components/CopyUrlButton';
import ShareButton from './components/ShareButton';
import { loadConfig, getEventTypeConfig } from './utils/configLoader';
import { getStateFromUrl, updateUrlState, isUrlEncrypted, decodeStateEncrypted } from './utils/urlState';

function App() {
  const [config, setConfig] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEventType, setSelectedEventType] = useState('feeding');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Password dialog state for encrypted URLs
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptError, setDecryptError] = useState('');
  const [encryptedHash, setEncryptedHash] = useState('');

  // Initialize app: load config and state from URL
  useEffect(() => {
    const initialize = async () => {
      try {
        // Always load config from YAML file first
        const loadedConfig = await loadConfig();
        setConfig(loadedConfig);
        
        // Check if URL has encrypted data
        const hash = window.location.hash.slice(1);
        
        if (isUrlEncrypted(hash)) {
          // Show password dialog for encrypted URLs
          setEncryptedHash(hash);
          setShowPasswordDialog(true);
          setLoading(false);
        } else {
          // Regular unencrypted URL
          const urlState = getStateFromUrl();
          const deserializedEvents = (urlState.data || []).map(event => ({
            ...event,
            timestamp: event.timestamp ? new Date(event.timestamp) : new Date()
          }));
          setEvents(deserializedEvents);
          setLoading(false);
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Handle decryption of encrypted URL
  const handleDecrypt = async () => {
    if (!decryptPassword) {
      setDecryptError('Please enter the password');
      return;
    }

    try {
      setDecryptError('');
      const urlState = await decodeStateEncrypted(encryptedHash, decryptPassword);
      
      const deserializedEvents = (urlState.data || []).map(event => ({
        ...event,
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date()
      }));
      
      setEvents(deserializedEvents);
      setShowPasswordDialog(false);
      setDecryptPassword('');
      setEncryptedHash('');
      
      // Update URL to unencrypted version so user can continue editing
      // This also prevents asking for password on page refresh
      updateUrlState(deserializedEvents.map(event => ({
        ...event,
        timestamp: event.timestamp instanceof Date 
          ? event.timestamp.toISOString() 
          : event.timestamp
      })), null);
    } catch (err) {
      console.error('Decryption failed:', err);
      setDecryptError('Incorrect password. Please try again.');
    }
  };

  const handleSkipDecrypt = () => {
    // Clear the encrypted hash and start fresh
    setShowPasswordDialog(false);
    setDecryptPassword('');
    setEncryptedHash('');
    setEvents([]);
    // Clear the URL hash
    window.history.replaceState(null, '', window.location.pathname);
  };

  // Sync state to URL whenever events change
  // Don't store config in URL - it's loaded from YAML file
  useEffect(() => {
    if (events !== null && !showPasswordDialog) {
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
  }, [events, showPasswordDialog]);

  // Listen for hash changes (back/forward navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      
      if (isUrlEncrypted(hash)) {
        setEncryptedHash(hash);
        setShowPasswordDialog(true);
      } else {
        const urlState = getStateFromUrl();
        if (urlState.data) {
          const deserializedEvents = urlState.data.map(event => ({
            ...event,
            timestamp: event.timestamp ? new Date(event.timestamp) : new Date()
          }));
          setEvents(deserializedEvents);
        }
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

  const handleJsonUpdate = (updatedEvents) => {
    // Ensure all timestamps are Date objects
    const normalizedEvents = updatedEvents.map(event => ({
      ...event,
      timestamp: event.timestamp instanceof Date 
        ? event.timestamp 
        : new Date(event.timestamp)
    }));
    setEvents(normalizedEvents);
  };

  const getCurrentEventTypeConfig = () => {
    if (!config) return null;
    return getEventTypeConfig(config, selectedEventType);
  };

  // Get baby name from config
  const babyName = config?.babyName || 'Baby';

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
      {/* Password Dialog for Encrypted URLs */}
      {showPasswordDialog && (
        <div className="share-dialog-overlay">
          <div className="share-dialog">
            <h3>🔒 Password Protected</h3>
            <div className="share-dialog-content">
              <p>This link is password protected. Enter the password to view the data.</p>
              <div className="form-field">
                <label htmlFor="decrypt-password">Password</label>
                <input
                  id="decrypt-password"
                  type="password"
                  value={decryptPassword}
                  onChange={(e) => setDecryptPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
                  placeholder="Enter password"
                  autoFocus
                />
              </div>
              {decryptError && <p className="share-error">{decryptError}</p>}
            </div>
            <div className="share-dialog-actions">
              <button
                onClick={handleSkipDecrypt}
                className="share-dialog-cancel"
              >
                Start Fresh
              </button>
              <button
                onClick={handleDecrypt}
                className="share-dialog-confirm"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="header-top">
          <h1>{babyName}'s Tracker</h1>
          <div className="header-buttons">
            <CopyUrlButton />
            <ShareButton babyName={babyName} events={events} />
          </div>
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

      <div className="json-section">
        <JsonEditor events={events} onUpdate={handleJsonUpdate} />
      </div>

      <div className="charts-section">
        <StatisticsModule events={events} />
        <DailyTimelineChart events={events} config={config} />
        <WeeklySummaryChart events={events} />
      </div>
    </div>
  );
}

export default App;
