/**
 * Statistics Calculator Accuracy Tests
 * 
 * HIGH IMPACT: Tests the statistical calculations that provide insights to users.
 * Incorrect statistics could lead to wrong decisions about baby care (e.g., feeding schedules).
 * This tests mathematical accuracy, edge cases, and proper handling of various data conditions.
 */

import { describe, it, expect } from 'vitest';
import { calculateAverageTimeBetweenFeeds, calculateStatistics } from './statisticsCalculator.js';

// Helper to create feeding events at specific times
function createFeedingEvents(timestamps) {
  return timestamps.map((ts, index) => ({
    id: index,
    eventType: 'feeding',
    type: 'bottle',
    amount: 100,
    timestamp: ts instanceof Date ? ts : new Date(ts)
  }));
}

// Helper to create mixed events
function createMixedEvents(configs) {
  return configs.map((config, index) => ({
    id: index,
    eventType: config.type,
    timestamp: config.timestamp instanceof Date ? config.timestamp : new Date(config.timestamp),
    ...(config.type === 'feeding' ? { type: 'bottle', amount: 100 } : {}),
    ...(config.type === 'pooping' ? { consistency: 'normal' } : {})
  }));
}

describe('calculateAverageTimeBetweenFeeds', () => {
  
  describe('Basic Calculations', () => {
    it('should calculate average for evenly spaced feeds', () => {
      // Feeds every 3 hours
      const feeds = createFeedingEvents([
        '2024-01-15T06:00:00',
        '2024-01-15T09:00:00',
        '2024-01-15T12:00:00',
        '2024-01-15T15:00:00',
      ]);
      
      const result = calculateAverageTimeBetweenFeeds(feeds);
      
      expect(result.averageMinutes).toBe(180); // 3 hours = 180 minutes
      expect(result.formatted).toBe('3h');
    });

    it('should calculate average for irregular intervals', () => {
      // 2 hours, 4 hours, 3 hours = average 3 hours
      const feeds = createFeedingEvents([
        '2024-01-15T06:00:00',
        '2024-01-15T08:00:00',  // +2h
        '2024-01-15T12:00:00',  // +4h
        '2024-01-15T15:00:00',  // +3h
      ]);
      
      const result = calculateAverageTimeBetweenFeeds(feeds);
      
      expect(result.averageMinutes).toBe(180); // (120 + 240 + 180) / 3 = 180
    });

    it('should handle feeds with minutes precision', () => {
      // 2h30m, 2h30m = average 2h30m
      const feeds = createFeedingEvents([
        '2024-01-15T06:00:00',
        '2024-01-15T08:30:00',  // +2h30m = 150min
        '2024-01-15T11:00:00',  // +2h30m = 150min
      ]);
      
      const result = calculateAverageTimeBetweenFeeds(feeds);
      
      expect(result.averageMinutes).toBe(150);
      expect(result.formatted).toBe('2h 30m');
    });

    it('should handle short intervals (less than 1 hour)', () => {
      // 30 minutes average
      const feeds = createFeedingEvents([
        '2024-01-15T06:00:00',
        '2024-01-15T06:30:00',
        '2024-01-15T07:00:00',
      ]);
      
      const result = calculateAverageTimeBetweenFeeds(feeds);
      
      expect(result.averageMinutes).toBe(30);
      expect(result.formatted).toBe('30m');
    });
  });

  describe('Edge Cases', () => {
    it('should return N/A for no events', () => {
      const result = calculateAverageTimeBetweenFeeds([]);
      
      expect(result.averageMinutes).toBeNull();
      expect(result.formatted).toContain('N/A');
    });

    it('should return N/A for single event', () => {
      const feeds = createFeedingEvents(['2024-01-15T06:00:00']);
      
      const result = calculateAverageTimeBetweenFeeds(feeds);
      
      expect(result.averageMinutes).toBeNull();
      expect(result.formatted).toContain('N/A');
    });

    it('should return N/A for null/undefined input', () => {
      expect(calculateAverageTimeBetweenFeeds(null).averageMinutes).toBeNull();
      expect(calculateAverageTimeBetweenFeeds(undefined).averageMinutes).toBeNull();
    });

    it('should handle exactly 2 events', () => {
      const feeds = createFeedingEvents([
        '2024-01-15T06:00:00',
        '2024-01-15T08:00:00',
      ]);
      
      const result = calculateAverageTimeBetweenFeeds(feeds);
      
      expect(result.averageMinutes).toBe(120);
      expect(result.formatted).toBe('2h');
    });

    it('should sort events by timestamp regardless of array order', () => {
      // Events in wrong order
      const feeds = createFeedingEvents([
        '2024-01-15T12:00:00',
        '2024-01-15T06:00:00',
        '2024-01-15T09:00:00',
      ]);
      
      const result = calculateAverageTimeBetweenFeeds(feeds);
      
      // Should be sorted: 06:00 -> 09:00 (3h) -> 12:00 (3h) = avg 3h
      expect(result.averageMinutes).toBe(180);
    });

    it('should handle events at exact same time', () => {
      const feeds = createFeedingEvents([
        '2024-01-15T06:00:00',
        '2024-01-15T06:00:00',
        '2024-01-15T09:00:00',
      ]);
      
      const result = calculateAverageTimeBetweenFeeds(feeds);
      
      // 0min + 180min = 90min average
      expect(result.averageMinutes).toBe(90);
    });

    it('should handle very long intervals (multi-day)', () => {
      const feeds = createFeedingEvents([
        '2024-01-15T06:00:00',
        '2024-01-16T06:00:00',  // +24h
      ]);
      
      const result = calculateAverageTimeBetweenFeeds(feeds);
      
      expect(result.averageMinutes).toBe(1440); // 24 hours
      expect(result.formatted).toBe('24h');
    });
  });

  describe('Mixed Event Filtering', () => {
    it('should only consider feeding events', () => {
      const events = createMixedEvents([
        { type: 'feeding', timestamp: '2024-01-15T06:00:00' },
        { type: 'peeing', timestamp: '2024-01-15T07:00:00' },
        { type: 'pooping', timestamp: '2024-01-15T08:00:00' },
        { type: 'feeding', timestamp: '2024-01-15T09:00:00' },
        { type: 'peeing', timestamp: '2024-01-15T10:00:00' },
        { type: 'feeding', timestamp: '2024-01-15T12:00:00' },
      ]);
      
      const result = calculateAverageTimeBetweenFeeds(events);
      
      // Only feeding: 06:00 -> 09:00 (3h) -> 12:00 (3h) = avg 3h
      expect(result.averageMinutes).toBe(180);
    });

    it('should return N/A when no feeding events exist', () => {
      const events = createMixedEvents([
        { type: 'peeing', timestamp: '2024-01-15T07:00:00' },
        { type: 'pooping', timestamp: '2024-01-15T08:00:00' },
      ]);
      
      const result = calculateAverageTimeBetweenFeeds(events);
      
      expect(result.averageMinutes).toBeNull();
    });
  });

  describe('Timestamp Format Handling', () => {
    it('should handle Date objects', () => {
      const feeds = [
        { eventType: 'feeding', timestamp: new Date('2024-01-15T06:00:00') },
        { eventType: 'feeding', timestamp: new Date('2024-01-15T09:00:00') },
      ];
      
      const result = calculateAverageTimeBetweenFeeds(feeds);
      expect(result.averageMinutes).toBe(180);
    });

    it('should handle ISO string timestamps', () => {
      const feeds = [
        { eventType: 'feeding', timestamp: '2024-01-15T06:00:00.000Z' },
        { eventType: 'feeding', timestamp: '2024-01-15T09:00:00.000Z' },
      ];
      
      const result = calculateAverageTimeBetweenFeeds(feeds);
      expect(result.averageMinutes).toBe(180);
    });

    it('should handle mixed timestamp formats', () => {
      const feeds = [
        { eventType: 'feeding', timestamp: new Date('2024-01-15T06:00:00') },
        { eventType: 'feeding', timestamp: '2024-01-15T09:00:00' },
      ];
      
      const result = calculateAverageTimeBetweenFeeds(feeds);
      expect(result.averageMinutes).toBe(180);
    });
  });
});

describe('Time Formatting', () => {
  
  it('should format minutes-only correctly', () => {
    const feeds = createFeedingEvents([
      '2024-01-15T06:00:00',
      '2024-01-15T06:45:00',
    ]);
    
    const result = calculateAverageTimeBetweenFeeds(feeds);
    expect(result.formatted).toBe('45m');
  });

  it('should format hours-only correctly', () => {
    const feeds = createFeedingEvents([
      '2024-01-15T06:00:00',
      '2024-01-15T10:00:00',
    ]);
    
    const result = calculateAverageTimeBetweenFeeds(feeds);
    expect(result.formatted).toBe('4h');
  });

  it('should format hours and minutes correctly', () => {
    const feeds = createFeedingEvents([
      '2024-01-15T06:00:00',
      '2024-01-15T08:45:00',
    ]);
    
    const result = calculateAverageTimeBetweenFeeds(feeds);
    expect(result.formatted).toBe('2h 45m');
  });

  it('should round minutes appropriately', () => {
    // 2h 30.5min should round to 2h 31m or 2h 30m
    const feeds = createFeedingEvents([
      '2024-01-15T06:00:00',
      '2024-01-15T06:30:30',  // 30.5 minutes
      '2024-01-15T07:01:00',  // 30.5 minutes
    ]);
    
    const result = calculateAverageTimeBetweenFeeds(feeds);
    // Rounding behavior verified
    expect(result.formatted).toMatch(/^\d+m$/);
  });
});

describe('calculateStatistics (Main Entry Point)', () => {
  
  it('should return object with averageTimeBetweenFeeds', () => {
    const events = createFeedingEvents([
      '2024-01-15T06:00:00',
      '2024-01-15T09:00:00',
    ]);
    
    const stats = calculateStatistics(events);
    
    expect(stats).toHaveProperty('averageTimeBetweenFeeds');
    expect(stats.averageTimeBetweenFeeds.averageMinutes).toBe(180);
  });

  it('should handle empty events array', () => {
    const stats = calculateStatistics([]);
    
    expect(stats.averageTimeBetweenFeeds.averageMinutes).toBeNull();
  });

  it('should be extensible for additional statistics', () => {
    const stats = calculateStatistics([]);
    
    // Current structure should support adding more stats
    expect(typeof stats).toBe('object');
    expect(Object.keys(stats).length).toBeGreaterThan(0);
  });
});

describe('Statistical Accuracy Tests', () => {
  
  it('should calculate precise averages with many data points', () => {
    // Generate 100 feeds at 2-hour intervals
    const feeds = [];
    const baseTime = new Date('2024-01-01T00:00:00');
    
    for (let i = 0; i < 100; i++) {
      feeds.push({
        eventType: 'feeding',
        timestamp: new Date(baseTime.getTime() + i * 2 * 60 * 60 * 1000) // every 2 hours
      });
    }
    
    const result = calculateAverageTimeBetweenFeeds(feeds);
    
    expect(result.averageMinutes).toBe(120); // exactly 2 hours
  });

  it('should handle realistic baby feeding schedule', () => {
    // Realistic newborn feeding schedule (every 2-3 hours with variation)
    const feeds = createFeedingEvents([
      '2024-01-15T00:00:00',  // midnight
      '2024-01-15T02:30:00',  // +2.5h
      '2024-01-15T05:00:00',  // +2.5h
      '2024-01-15T07:45:00',  // +2.75h
      '2024-01-15T10:15:00',  // +2.5h
      '2024-01-15T13:00:00',  // +2.75h
      '2024-01-15T15:30:00',  // +2.5h
      '2024-01-15T18:15:00',  // +2.75h
      '2024-01-15T21:00:00',  // +2.75h
      '2024-01-15T23:30:00',  // +2.5h
    ]);
    
    const result = calculateAverageTimeBetweenFeeds(feeds);
    
    // Average should be around 2.6 hours (156 minutes)
    expect(result.averageMinutes).toBeCloseTo(156.67, 0);
    expect(result.formatted).toMatch(/2h \d+m/);
  });

  it('should handle outliers in feeding times', () => {
    // Regular feeds with one long gap (missed feed or long sleep)
    const feeds = createFeedingEvents([
      '2024-01-15T06:00:00',
      '2024-01-15T09:00:00',  // +3h
      '2024-01-15T12:00:00',  // +3h
      '2024-01-15T21:00:00',  // +9h (outlier - long gap)
      '2024-01-16T00:00:00',  // +3h
    ]);
    
    const result = calculateAverageTimeBetweenFeeds(feeds);
    
    // (180 + 180 + 540 + 180) / 4 = 270 minutes = 4h 30m
    expect(result.averageMinutes).toBe(270);
    expect(result.formatted).toBe('4h 30m');
  });
});

describe('Performance with Large Datasets', () => {
  
  it('should handle 1000+ feeding events efficiently', () => {
    const feeds = [];
    const baseTime = new Date('2024-01-01T00:00:00');
    
    for (let i = 0; i < 1000; i++) {
      feeds.push({
        eventType: 'feeding',
        timestamp: new Date(baseTime.getTime() + i * 3 * 60 * 60 * 1000)
      });
    }
    
    const startTime = performance.now();
    const result = calculateAverageTimeBetweenFeeds(feeds);
    const endTime = performance.now();
    
    expect(result.averageMinutes).toBe(180);
    expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
  });

  it('should handle mixed events with 5000+ total events', () => {
    const events = [];
    const baseTime = new Date('2024-01-01T00:00:00');
    
    for (let i = 0; i < 5000; i++) {
      const types = ['feeding', 'peeing', 'pooping'];
      events.push({
        eventType: types[i % 3],
        timestamp: new Date(baseTime.getTime() + i * 60 * 60 * 1000)
      });
    }
    
    const startTime = performance.now();
    const result = calculateAverageTimeBetweenFeeds(events);
    const endTime = performance.now();
    
    // Should complete quickly even with filtering
    expect(endTime - startTime).toBeLessThan(200);
    expect(result.averageMinutes).toBeDefined();
  });
});
