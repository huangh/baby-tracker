import { describe, it, expect } from 'vitest';
import { calculateAverageTimeBetweenFeeds } from './statisticsCalculator';

describe('Statistics Calculator', () => {
  describe('calculateAverageTimeBetweenFeeds', () => {
    it('should return N/A if fewer than 2 feeding events', () => {
      const events = [
        { eventType: 'feeding', timestamp: new Date('2023-01-01T10:00:00') }
      ];
      const result = calculateAverageTimeBetweenFeeds(events);
      expect(result.averageMinutes).toBeNull();
      expect(result.formatted).toContain('N/A');
    });

    it('should calculate correct average for multiple feeds', () => {
      const baseTime = new Date('2023-01-01T10:00:00');
      const events = [
        { 
          eventType: 'feeding', 
          timestamp: baseTime 
        },
        { 
          eventType: 'feeding', 
          timestamp: new Date(baseTime.getTime() + 60 * 60 * 1000) // +1 hour
        },
        { 
          eventType: 'feeding', 
          timestamp: new Date(baseTime.getTime() + 180 * 60 * 1000) // +3 hours (2 hours diff)
        }
      ];
      // Diff 1: 60 mins
      // Diff 2: 120 mins
      // Average: 90 mins (1h 30m)

      const result = calculateAverageTimeBetweenFeeds(events);
      expect(result.averageMinutes).toBe(90);
      expect(result.formatted).toBe('1h 30m');
    });

    it('should ignore non-feeding events', () => {
      const baseTime = new Date('2023-01-01T10:00:00');
      const events = [
        { eventType: 'feeding', timestamp: baseTime },
        { eventType: 'pooping', timestamp: new Date(baseTime.getTime() + 30 * 60 * 1000) },
        { eventType: 'feeding', timestamp: new Date(baseTime.getTime() + 60 * 60 * 1000) }
      ];
      
      const result = calculateAverageTimeBetweenFeeds(events);
      expect(result.averageMinutes).toBe(60);
    });

    it('should handle unsorted events', () => {
       const baseTime = new Date('2023-01-01T10:00:00');
       const events = [
         { eventType: 'feeding', timestamp: new Date(baseTime.getTime() + 60 * 60 * 1000) },
         { eventType: 'feeding', timestamp: baseTime }
       ];
       
       const result = calculateAverageTimeBetweenFeeds(events);
       expect(result.averageMinutes).toBe(60);
    });

    it('should handle string timestamps', () => {
      const events = [
        { eventType: 'feeding', timestamp: '2023-01-01T10:00:00' },
        { eventType: 'feeding', timestamp: '2023-01-01T12:30:00' }
      ];
      // 150 mins
      const result = calculateAverageTimeBetweenFeeds(events);
      expect(result.averageMinutes).toBe(150);
      expect(result.formatted).toBe('2h 30m');
    });
  });
});
