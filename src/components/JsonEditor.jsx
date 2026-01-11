import React, { useState, useEffect } from 'react';

/**
 * JsonEditor Component
 * Allows viewing and editing events data as JSON
 */
export default function JsonEditor({ events, onUpdate }) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Update JSON text when events change (but not while editing)
  useEffect(() => {
    if (!isEditing) {
      try {
        const formatted = JSON.stringify(events, null, 2);
        setJsonText(formatted);
        setError(null);
      } catch (err) {
        setError('Error formatting JSON');
      }
    }
  }, [events, isEditing]);

  const handleChange = (e) => {
    setJsonText(e.target.value);
    setIsEditing(true);
    setError(null);
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      
      // Validate it's an array
      if (!Array.isArray(parsed)) {
        setError('JSON must be an array of events');
        return;
      }

      // Validate each event has required fields
      for (const event of parsed) {
        if (!event.eventType || !event.timestamp) {
          setError('Each event must have eventType and timestamp');
          return;
        }
        
        // Convert timestamp strings to Date objects
        if (typeof event.timestamp === 'string') {
          event.timestamp = new Date(event.timestamp);
        }
      }

      // Update events with validated data
      onUpdate(validatedEvents);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  const handleCancel = () => {
    // Reset to current events
    try {
      const formatted = JSON.stringify(events, null, 2);
      setJsonText(formatted);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError('Error resetting JSON');
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setError(null);
    } catch (err) {
      setError(`Invalid JSON: ${err.message}`);
    }
  };

  return (
    <div className="json-editor">
      <div className="json-editor-header">
        <h3>Data (JSON)</h3>
        <div className="json-editor-actions">
          {isEditing && (
            <>
              <button className="json-button json-button-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button className="json-button json-button-primary" onClick={handleApply}>
                Apply Changes
              </button>
            </>
          )}
          {!isEditing && (
            <button className="json-button json-button-secondary" onClick={handleFormat}>
              Format
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="json-error">
          {error}
        </div>
      )}
      <textarea
        className="json-textarea"
        value={jsonText}
        onChange={handleChange}
        placeholder="[]"
        spellCheck={false}
      />
      <div className="json-info">
        {events.length} event{events.length !== 1 ? 's' : ''} • {JSON.stringify(events).length} characters
      </div>
    </div>
  );
}

