const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'baby_tracker.db');
const db = new Database(dbPath);

// Initialize database schema
function initializeDatabase() {
  // Create events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
  `);
  
  console.log('Database initialized successfully');
}

// Initialize database on startup
initializeDatabase();

// API Routes

// GET all events
app.get('/api/events', (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, event_type, timestamp, data FROM events ORDER BY timestamp DESC');
    const rows = stmt.all();
    
    // Parse JSON data for each event
    const events = rows.map(row => {
      const eventData = JSON.parse(row.data);
      return {
        id: row.id,
        eventType: row.event_type,
        timestamp: new Date(row.timestamp),
        ...eventData
      };
    });
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST new event(s)
app.post('/api/events', (req, res) => {
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    const insertedEvents = [];
    
    const insertStmt = db.prepare(`
      INSERT INTO events (event_type, timestamp, data)
      VALUES (?, ?, ?)
    `);
    
    const insertMany = db.transaction((events) => {
      for (const event of events) {
        const { id, eventType, timestamp, ...rest } = event;
        
        // Ensure timestamp is a valid date string
        const timestampStr = timestamp instanceof Date 
          ? timestamp.toISOString() 
          : new Date(timestamp).toISOString();
        
        // Store all event data except id, eventType, timestamp in the data JSON field
        const data = JSON.stringify(rest);
        
        const result = insertStmt.run(eventType, timestampStr, data);
        
        insertedEvents.push({
          id: result.lastInsertRowid,
          eventType,
          timestamp: new Date(timestampStr),
          ...rest
        });
      }
    });
    
    insertMany(events);
    
    res.status(201).json(insertedEvents);
  } catch (error) {
    console.error('Error inserting events:', error);
    res.status(500).json({ error: 'Failed to insert events' });
  }
});

// PUT update event
app.put('/api/events/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { eventType, timestamp, ...rest } = req.body;
    
    const timestampStr = timestamp instanceof Date 
      ? timestamp.toISOString() 
      : new Date(timestamp).toISOString();
    
    const data = JSON.stringify(rest);
    
    const stmt = db.prepare(`
      UPDATE events 
      SET event_type = ?, timestamp = ?, data = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(eventType, timestampStr, data, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({
      id: parseInt(id),
      eventType,
      timestamp: new Date(timestampStr),
      ...rest
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE event
app.delete('/api/events/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM events WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Sync endpoint: replace all events (for JSON editor updates)
app.post('/api/events/sync', (req, res) => {
  try {
    const events = req.body;
    
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Expected array of events' });
    }
    
    const deleteStmt = db.prepare('DELETE FROM events');
    const insertStmt = db.prepare(`
      INSERT INTO events (event_type, timestamp, data)
      VALUES (?, ?, ?)
    `);
    
    const syncAll = db.transaction((events) => {
      // Delete all existing events
      deleteStmt.run();
      
      // Insert all new events
      const insertedEvents = [];
      for (const event of events) {
        const { id, eventType, timestamp, ...rest } = event;
        
        const timestampStr = timestamp instanceof Date 
          ? timestamp.toISOString() 
          : new Date(timestamp).toISOString();
        
        const data = JSON.stringify(rest);
        
        const result = insertStmt.run(eventType, timestampStr, data);
        
        insertedEvents.push({
          id: result.lastInsertRowid,
          eventType,
          timestamp: new Date(timestampStr),
          ...rest
        });
      }
      
      return insertedEvents;
    });
    
    const insertedEvents = syncAll(events);
    
    res.json(insertedEvents);
  } catch (error) {
    console.error('Error syncing events:', error);
    res.status(500).json({ error: 'Failed to sync events' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: ${dbPath}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});
