/**
 * CSV Export Utility
 * Converts events array to CSV format
 */

export function eventsToCSV(events) {
  if (!events || events.length === 0) {
    return 'No events to export';
  }

  // Collect all unique field names across all events
  const allFields = new Set(['id', 'eventType', 'timestamp']);
  events.forEach(event => {
    Object.keys(event).forEach(key => {
      if (key !== 'id' && key !== 'eventType' && key !== 'timestamp') {
        allFields.add(key);
      }
    });
  });

  // Define header mapping for better readability
  const headerMap = {
    'id': 'ID',
    'eventType': 'Event Type',
    'timestamp': 'Timestamp',
    'type': 'Type',
    'amount': 'Amount (ml)',
    'consistency': 'Consistency',
    'notes': 'Notes'
  };

  // Create headers array with readable names
  const headers = Array.from(allFields).map(field => 
    headerMap[field] || field.charAt(0).toUpperCase() + field.slice(1)
  );

  // Convert events to CSV rows
  const rows = events.map(event => {
    const timestamp = event.timestamp instanceof Date 
      ? event.timestamp.toISOString()
      : new Date(event.timestamp).toISOString();
    
    // Build row with all fields in the same order as headers
    const row = Array.from(allFields).map(field => {
      if (field === 'timestamp') {
        return timestamp;
      }
      const value = event[field];
      return value !== undefined && value !== null ? String(value) : '';
    });

    // Escape fields that contain commas, quotes, or newlines
    return row.map(field => {
      const fieldStr = String(field);
      if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
        return `"${fieldStr.replace(/"/g, '""')}"`;
      }
      return fieldStr;
    });
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

export function downloadCSV(events, filename = 'baby-tracker-export.csv') {
  const csvContent = eventsToCSV(events);
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}
