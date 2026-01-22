import React, { useState } from 'react';
import { downloadCSV } from '../utils/csvExport';

/**
 * ExportCsvButton Component
 * Button that exports all events to CSV file
 */
export default function ExportCsvButton({ events }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    if (!events || events.length === 0) {
      alert('No events to export');
      return;
    }

    setExporting(true);
    
    try {
      // Generate filename with current date
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `baby-tracker-export-${dateStr}.csv`;
      
      downloadCSV(events, filename);
      
      // Reset exporting state after a brief delay
      setTimeout(() => setExporting(false), 1000);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('Failed to export CSV. Please try again.');
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="export-csv-button"
      title="Export all events to CSV"
      disabled={exporting || !events || events.length === 0}
    >
      {exporting ? '⏳ Exporting...' : '📊 Export CSV'}
    </button>
  );
}
