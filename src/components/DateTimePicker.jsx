import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

/**
 * DateTimePicker Component
 * Shows a checkbox to use "now" or a date/time picker for custom time
 */
export default function DateTimePicker({ value, onChange, label, required }) {
  // Initialize useNow based on whether we have a valid date value
  const [useNow, setUseNow] = useState(() => {
    if (!value) return true;
    // If we have a value, check if it's very recent (within last few seconds)
    // This is a heuristic to detect "now" default values
    const dateValue = value instanceof Date ? value : new Date(value);
    const now = new Date();
    const diff = Math.abs(now - dateValue);
    return diff < 5000; // If within 5 seconds, consider it "now"
  });

  // Update useNow when value changes externally
  useEffect(() => {
    // #region agent log
    try {
      fetch('http://127.0.0.1:7243/ingest/b59410d3-b4c0-4415-a721-a578a096f810',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DateTimePicker.jsx:22',message:'useEffect entry',data:{hasValue:!!value,valueType:value?.constructor?.name,valueIso:value?.toISOString?.()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    } catch(e) {}
    // #endregion
    if (value) {
      const dateValue = value instanceof Date ? value : new Date(value);
      const now = new Date();
      const diff = Math.abs(now - dateValue);
      const shouldUseNow = diff < 5000;
      // #region agent log
      try {
        fetch('http://127.0.0.1:7243/ingest/b59410d3-b4c0-4415-a721-a578a096f810',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DateTimePicker.jsx:27',message:'Before setUseNow',data:{diff:diff,shouldUseNow:shouldUseNow,currentUseNow:useNow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      } catch(e) {}
      // #endregion
      setUseNow(shouldUseNow);
      // #region agent log
      try {
        fetch('http://127.0.0.1:7243/ingest/b59410d3-b4c0-4415-a721-a578a096f810',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DateTimePicker.jsx:28',message:'After setUseNow',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      } catch(e) {}
      // #endregion
    }
  }, [value]);

  const handleNowToggle = (checked) => {
    setUseNow(checked);
    if (checked) {
      onChange(new Date());
    }
  };

  const handleDateChange = (date) => {
    if (date) {
      onChange(date);
    }
  };

  // Ensure value is a Date object
  const dateValue = value instanceof Date ? value : (value ? new Date(value) : new Date());

  return (
    <div className="datetime-picker">
      <label>{label}{required && <span className="required">*</span>}</label>
      <div className="datetime-controls">
        <label className="use-now-checkbox">
          <input
            type="checkbox"
            checked={useNow}
            onChange={(e) => handleNowToggle(e.target.checked)}
          />
          <span>Use current time</span>
        </label>
        {!useNow && (
          <DatePicker
            selected={dateValue}
            onChange={handleDateChange}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={1}
            dateFormat="yyyy-MM-dd HH:mm"
            className="date-picker-input"
            required={required}
          />
        )}
        {useNow && (
          <div className="current-time-display">
            {new Date().toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
