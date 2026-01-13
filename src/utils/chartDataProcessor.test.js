import { describe, it, expect } from 'vitest';
import { filterTodayEvents, groupEventsByDay, getHourOfDay } from './chartDataProcessor';

describe('chartDataProcessor', () => {
  describe('filterTodayEvents', () => {
    it('should filter events for today', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const events = [
        { timestamp: today },
        { timestamp: yesterday }
      ];
      
      const filtered = filterTodayEvents(events);
      expect(filtered.length).toBe(1);
      expect(filtered[0].timestamp).toBe(today);
    });

    it('should return empty array if no events', () => {
      expect(filterTodayEvents([])).toEqual([]);
    });
  });

  describe('groupEventsByDay', () => {
    it('should group events by day for last 7 days', () => {
      const today = new Date();
      const todayEvent = { eventType: 'feeding', timestamp: today };
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEvent = { eventType: 'diaper', timestamp: yesterday };
      
      const events = [todayEvent, yesterdayEvent];
      
      const groups = groupEventsByDay(events);
      expect(groups.length).toBe(7); // Always returns 7 days? Checking impl: Yes loop i=6 to 0.
      
      const todayGroup = groups[groups.length - 1]; // Last item is today (i=0)? 
      // i=6 is 6 days ago. i=0 is today.
      // push order: 6 days ago ... today.
      
      // Wait, let's check loop:
      // for (let i = 6; i >= 0; i--) { ... days.push(...) }
      // So first pushed is i=6 (6 days ago). Last pushed is i=0 (today).
      
      expect(todayGroup.label).toBe('Today');
      expect(todayGroup.feeds).toBe(1);
      
      const yesterdayGroup = groups[groups.length - 2];
      expect(yesterdayGroup.label).toBe('Yesterday');
      expect(yesterdayGroup.feeds).toBe(0);
      // 'diaper' isn't counted in feeds, pees, poops?
      // pees = eventType === 'peeing'
      // poops = eventType === 'pooping'
      // diaper isn't in default list in test, let's assume 'peeing' or 'pooping'.
      // The impl checks specific strings.
    });
  });

  describe('getHourOfDay', () => {
    it('should calculate hour of day correctly', () => {
        const date = new Date('2023-01-01T14:30:00');
        const hour = getHourOfDay(date);
        expect(hour).toBe(14.5);
    });
  });
});
