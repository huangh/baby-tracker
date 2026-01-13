import { describe, it, expect } from 'vitest';
import { calculateAverageTimeBetweenFeeds } from './statisticsCalculator';

describe('calculateAverageTimeBetweenFeeds', () => {
  it('should return N/A if fewer than 2 feeding events', () => {
    const events = [
      { eventType: 'feeding', timestamp: new Date('2023-01-01T10:00:00') }
    ];
    const result = calculateAverageTimeBetweenFeeds(events);
    expect(result.averageMinutes).toBeNull();
    expect(result.formatted).toBe('N/A (need at least 2 feeds)');
  });

  it('should ignore non-feeding events', () => {
    const events = [
      { eventType: 'feeding', timestamp: new Date('2023-01-01T10:00:00') },
      { eventType: 'diaper', timestamp: new Date('2023-01-01T11:00:00') }
    ];
    const result = calculateAverageTimeBetweenFeeds(events);
    expect(result.averageMinutes).toBeNull();
  });

  it('should calculate average time correctly for 2 events', () => {
    const events = [
      { eventType: 'feeding', timestamp: new Date('2023-01-01T10:00:00') },
      { eventType: 'feeding', timestamp: new Date('2023-01-01T12:00:00') }
    ];
    // diff is 2 hours = 120 minutes
    const result = calculateAverageTimeBetweenFeeds(events);
    expect(result.averageMinutes).toBe(120);
    expect(result.formatted).toBe('2h');
  });

  it('should calculate average time correctly for 3 events', () => {
    const events = [
      { eventType: 'feeding', timestamp: new Date('2023-01-01T10:00:00') },
      { eventType: 'feeding', timestamp: new Date('2023-01-01T11:00:00') }, // 60 mins diff
      { eventType: 'feeding', timestamp: new Date('2023-01-01T13:00:00') }  // 120 mins diff
    ];
    // total diff 180 mins, 2 intervals. avg = 90 mins
    const result = calculateAverageTimeBetweenFeeds(events);
    expect(result.averageMinutes).toBe(90);
    expect(result.formatted).toBe('1h 30m');
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

  it('should sort events by timestamp before calculating', () => {
    const events = [
      { eventType: 'feeding', timestamp: new Date('2023-01-01T12:00:00') },
      { eventType: 'feeding', timestamp: new Date('2023-01-01T10:00:00') }
    ];
    const result = calculateAverageTimeBetweenFeeds(events);
    expect(result.averageMinutes).toBe(120);
  });
});
