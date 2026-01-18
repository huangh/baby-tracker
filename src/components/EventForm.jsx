import React, { useState, useEffect, useRef } from 'react';
import DateTimePicker from './DateTimePicker';

/**
 * EventForm Component
 * Dynamically renders form fields based on YAML config
 */
export default function EventForm({ eventTypeConfig, onSubmit, initialValues = {} }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const initializedRef = useRef(false);
  const lastConfigIdRef = useRef(null);

  useEffect(() => {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7243/ingest/b59410d3-b4c0-4415-a721-a578a096f810',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventForm.jsx:12',message:'useEffect entry',data:{hasConfig:!!eventTypeConfig,configId:eventTypeConfig?.id,initialValuesKeys:Object.keys(initialValues).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    } catch(e) {}
    // #endregion
    // Initialize form data with defaults
    const initialData = {};
    if (eventTypeConfig && eventTypeConfig.fields) {
      eventTypeConfig.fields.forEach(field => {
        if (field.default === 'now' && field.type === 'datetime') {
          const dateValue = new Date();
          // #region agent log
          try {
            fetch('http://127.0.0.1:7243/ingest/b59410d3-b4c0-4415-a721-a578a096f810',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventForm.jsx:18',message:'Creating new Date',data:{fieldId:field.id,dateValue:dateValue.toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          } catch(e) {}
          // #endregion
          initialData[field.id] = dateValue;
        } else if (field.default !== undefined) {
          initialData[field.id] = field.default;
        } else if (initialValues[field.id] !== undefined) {
          initialData[field.id] = initialValues[field.id];
        } else {
          initialData[field.id] = field.type === 'number' ? '' : '';
        }
      });
    }
    // #region agent log
    try {
      fetch('http://127.0.0.1:7243/ingest/b59410d3-b4c0-4415-a721-a578a096f810',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventForm.jsx:28',message:'Before setFormData',data:{initialDataKeys:Object.keys(initialData),hasTimestamp:!!initialData.timestamp,timestampType:initialData.timestamp?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    } catch(e) {}
    // #endregion
    // Only update if config ID changed or not yet initialized
    const currentConfigId = eventTypeConfig?.id;
    if (!initializedRef.current || lastConfigIdRef.current !== currentConfigId) {
      setFormData(initialData);
      initializedRef.current = true;
      lastConfigIdRef.current = currentConfigId;
      // #region agent log
      try {
        fetch('http://127.0.0.1:7243/ingest/b59410d3-b4c0-4415-a721-a578a096f810',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventForm.jsx:35',message:'After setFormData',data:{configId:currentConfigId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      } catch(e) {}
      // #endregion
    }
    // #region agent log
    try {
      fetch('http://127.0.0.1:7243/ingest/b59410d3-b4c0-4415-a721-a578a096f810',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EventForm.jsx:42',message:'useEffect skipped',data:{initialized:initializedRef.current,configIdChanged:lastConfigIdRef.current !== currentConfigId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    } catch(e) {}
    // #endregion
  }, [eventTypeConfig?.id]); // Removed initialValues to prevent infinite loop

  const handleChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!eventTypeConfig || !eventTypeConfig.fields) {
      return false;
    }

    eventTypeConfig.fields.forEach(field => {
      const value = formData[field.id];
      
      if (field.required && (value === undefined || value === null || value === '')) {
        newErrors[field.id] = `${field.label} is required`;
      }

      if (field.type === 'number' && value !== undefined && value !== '') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          newErrors[field.id] = `${field.label} must be a number`;
        } else if (field.min !== undefined && numValue < field.min) {
          newErrors[field.id] = `${field.label} must be at least ${field.min}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        eventType: eventTypeConfig.id,
        timestamp: formData.timestamp || new Date()
      });
      // Reset form to defaults
      const defaultData = {};
      eventTypeConfig.fields.forEach(field => {
        if (field.default === 'now' && field.type === 'datetime') {
          defaultData[field.id] = new Date();
        } else {
          defaultData[field.id] = field.type === 'number' ? '' : '';
        }
      });
      setFormData(defaultData);
    }
  };

  if (!eventTypeConfig || !eventTypeConfig.fields) {
    return <div>No event type selected</div>;
  }

  const renderField = (field) => {
    const value = formData[field.id];
    const error = errors[field.id];

    switch (field.type) {
      case 'datetime':
        return (
          <DateTimePicker
            key={field.id}
            id={field.id}
            value={value}
            onChange={(date) => handleChange(field.id, date)}
            label={field.label}
            required={field.required}
          />
        );

      case 'select':
        return (
          <div key={field.id} className="form-field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <select
              id={field.id}
              value={value || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {field.options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <span className="error">{error}</span>}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="form-field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              id={field.id}
              type="number"
              value={value || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              min={field.min}
              step={field.step || 1}
              required={field.required}
            />
            {error && <span className="error">{error}</span>}
          </div>
        );

      case 'text':
        return (
          <div key={field.id} className="form-field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              id={field.id}
              type="text"
              value={value || ''}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder={field.placeholder || ''}
              required={field.required}
            />
            {error && <span className="error">{error}</span>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="event-form" noValidate>
      <h2>{eventTypeConfig.label}</h2>
      {eventTypeConfig.fields.map(field => renderField(field))}
      <button type="submit" className="submit-button">
        Add Event
      </button>
    </form>
  );
}
