import React, { useState, useEffect, useRef } from 'react';
import MobileEventInput from './components/MobileEventInput';
import EventList from './components/EventList';
import DailyTimelineChart from './components/charts/DailyTimelineChart';
import WeeklySummaryChart from './components/charts/WeeklySummaryChart';
import StatisticsModule from './components/statistics/StatisticsModule';
import JsonEditor from './components/JsonEditor';
import CopyUrlButton from './components/CopyUrlButton';
import ShareButton from './components/ShareButton';
import ExportCsvButton from './components/ExportCsvButton';
import { loadConfig } from './utils/configLoader';
import { getStateFromUrl, updateUrlState, isUrlEncrypted, decodeStateEncrypted } from './utils/urlState';

// API base URL - defaults to localhost:3001 in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API utility functions
async function fetchEventsFromDB() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/events`);
    if (!response.ok) {
      throw new Error('Failed to fetch events from database');
    }
    const events = await response.json();
    // Convert timestamp strings to Date objects
    return events.map(event => ({
      ...event,
      timestamp: new Date(event.timestamp)
    }));
  } catch (error) {
    console.error('Error fetching events from database:', error);
    throw error;
  }
}

async function saveEventToDB(event) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...event,
        timestamp: event.timestamp instanceof Date 
          ? event.timestamp.toISOString() 
          : event.timestamp
      })
    });
    if (!response.ok) {
      throw new Error('Failed to save event to database');
    }
    const savedEvent = await response.json();
    // Convert timestamp string to Date object
    return {
      ...savedEvent[0],
      timestamp: new Date(savedEvent[0].timestamp)
    };
  } catch (error) {
    console.error('Error saving event to database:', error);
    throw error;
  }
}

async function syncEventsToDB(events) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(events.map(event => ({
        ...event,
        timestamp: event.timestamp instanceof Date 
          ? event.timestamp.toISOString() 
          : event.timestamp
      })))
    });
    if (!response.ok) {
      throw new Error('Failed to sync events to database');
    }
    const syncedEvents = await response.json();
    // Convert timestamp strings to Date objects
    return syncedEvents.map(event => ({
      ...event,
      timestamp: new Date(event.timestamp)
    }));
  } catch (error) {
    console.error('Error syncing events to database:', error);
    throw error;
  }
}

function App() {
  const [config, setConfig] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Password dialog state for encrypted URLs
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptError, setDecryptError] = useState('');
  const [encryptedHash, setEncryptedHash] = useState('');
  
  // Ref for charts section (for scrolling on mobile)
  const chartsSectionRef = useRef(null);

  // Initialize app: load config and state from database
  useEffect(() => {
    const initialize = async () => {
      try {
        // Always load config from YAML file first
        const loadedConfig = await loadConfig();
        setConfig(loadedConfig);
        
        // Try to load events from database first
        try {
          const dbEvents = await fetchEventsFromDB();
          if (dbEvents.length > 0) {
            setEvents(dbEvents);
            setLoading(false);
            return;
          }
        } catch (dbError) {
          console.warn('Database not available, falling back to URL:', dbError);
        }
        
        // Fallback to URL if database is empty or unavailable
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
          
          // If we have URL events, sync them to database
          if (deserializedEvents.length > 0) {
            try {
              await syncEventsToDB(deserializedEvents);
            } catch (syncError) {
              console.warn('Failed to sync URL events to database:', syncError);
            }
          }
          
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

  // Sync state to URL whenever events change (as backup/portability)
  // Don't store config in URL - it's loaded from YAML file
  // Database is primary storage, URL is secondary
  useEffect(() => {
    if (events !== null && !showPasswordDialog && events.length > 0) {
      // Convert Date objects to ISO strings for serialization
      const serializedEvents = events.map(event => ({
        ...event,
        timestamp: event.timestamp instanceof Date 
          ? event.timestamp.toISOString() 
          : event.timestamp
      }));
      
      // Only store events in URL, not config (config comes from YAML)
      // This provides portability/backup, but database is primary
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

  const handleEventSubmit = async (eventData) => {
    const newEvent = {
      ...eventData,
      timestamp: eventData.timestamp instanceof Date 
        ? eventData.timestamp 
        : new Date(eventData.timestamp)
    };
    
    try {
      // Save to database first
      const savedEvent = await saveEventToDB(newEvent);
      
      // Update events state (this will trigger URL sync via useEffect)
      setEvents(prev => {
        const updated = [...prev, savedEvent];
        return updated;
      });
    } catch (error) {
      console.error('Failed to save event to database:', error);
      // Fallback: add event locally without database
      const fallbackEvent = {
        ...newEvent,
        id: Date.now() + Math.random()
      };
      setEvents(prev => [...prev, fallbackEvent]);
    }
  };

  const handleJsonUpdate = async (updatedEvents) => {
    // Ensure all timestamps are Date objects
    const normalizedEvents = updatedEvents.map(event => ({
      ...event,
      timestamp: event.timestamp instanceof Date 
        ? event.timestamp 
        : new Date(event.timestamp)
    }));
    
    try {
      // Sync to database
      const syncedEvents = await syncEventsToDB(normalizedEvents);
      setEvents(syncedEvents);
    } catch (error) {
      console.error('Failed to sync events to database:', error);
      // Fallback: update locally without database
      setEvents(normalizedEvents);
    }
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
            <ExportCsvButton events={events} />
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="input-section">
          <MobileEventInput
            events={events}
            onSubmit={handleEventSubmit}
            config={config}
            chartsSectionRef={chartsSectionRef}
          />
        </div>

        <div className="list-section">
          <EventList events={events} config={config} />
        </div>
      </main>

      <div className="charts-section" ref={chartsSectionRef}>
        <StatisticsModule events={events} />
        <DailyTimelineChart events={events} config={config} />
        <WeeklySummaryChart events={events} />
      </div>

      <div className="json-section">
        <JsonEditor events={events} onUpdate={handleJsonUpdate} />
      </div>
    </div>
  );
}

export default App;
