/**
 * URL State Length Test
 * Tests the maximum number of events that can be stored in the URL
 */

import { describe, it, expect } from 'vitest';
import { encodeState, decodeState } from './urlState.js';

// Common URL length limits for different browsers/use cases
const URL_LIMITS = {
  IE_MAX: 2083,           // Internet Explorer maximum
  SAFE_SHARING: 2000,     // Safe for most sharing scenarios
  PRACTICAL: 4000,        // Practical limit for most use cases
  CHROME_SAFE: 8000,      // Safe for Chrome
  MODERN_BROWSERS: 32000, // Most modern browsers
  CHROME_MAX: 65536,      // Chrome theoretical maximum
};

// Event generators for each type based on config.yaml
const eventGenerators = {
  feeding: (index) => ({
    id: `feeding_${index}`,
    type: 'feeding',
    data: {
      type: ['breastmilk', 'formula', 'bottle'][index % 3],
      amount: 50 + (index % 200),
      timestamp: new Date(Date.now() - index * 3600000).toISOString()
    }
  }),
  
  peeing: (index) => ({
    id: `peeing_${index}`,
    type: 'peeing',
    data: {
      timestamp: new Date(Date.now() - index * 3600000).toISOString()
    }
  }),
  
  pooping: (index) => ({
    id: `pooping_${index}`,
    type: 'pooping',
    data: {
      timestamp: new Date(Date.now() - index * 3600000).toISOString(),
      consistency: ['soft', 'normal', 'hard', 'watery'][index % 4]
    }
  })
};

// Generate a mixed set of events (one of each type)
function generateMixedEventSet(setIndex) {
  return [
    eventGenerators.feeding(setIndex * 3),
    eventGenerators.peeing(setIndex * 3 + 1),
    eventGenerators.pooping(setIndex * 3 + 2)
  ];
}

// Sample config (minimal version from config.yaml)
const sampleConfig = {
  events: [
    { id: 'feeding', label: 'Feeding' },
    { id: 'peeing', label: 'Peeing' },
    { id: 'pooping', label: 'Pooping' }
  ]
};

describe('URL State Length Tests', () => {
  
  describe('Single Event Size Analysis', () => {
    it('should measure the encoded size of each event type', () => {
      const eventTypes = ['feeding', 'peeing', 'pooping'];
      const results = {};
      
      eventTypes.forEach(type => {
        const event = eventGenerators[type](0);
        const encoded = encodeState([event], null);
        results[type] = {
          event: event,
          encodedLength: encoded.length,
          jsonLength: JSON.stringify({ data: [event], config: null }).length
        };
      });
      
      console.log('\n=== Single Event Size Analysis ===');
      Object.entries(results).forEach(([type, info]) => {
        console.log(`${type}:`);
        console.log(`  JSON length: ${info.jsonLength} bytes`);
        console.log(`  Encoded URL length: ${info.encodedLength} chars`);
      });
      
      // Verify encoding works
      Object.entries(results).forEach(([type, info]) => {
        expect(info.encodedLength).toBeGreaterThan(0);
      });
    });
  });

  describe('URL Length Growth Analysis', () => {
    it('should measure URL length as events are added', () => {
      const measurements = [];
      const events = [];
      
      // Add events incrementally and measure
      for (let i = 0; i < 100; i++) {
        const mixedSet = generateMixedEventSet(i);
        events.push(...mixedSet);
        
        const encoded = encodeState(events, null);
        measurements.push({
          eventCount: events.length,
          urlLength: encoded.length,
          avgPerEvent: encoded.length / events.length
        });
      }
      
      console.log('\n=== URL Length Growth (Sample Points) ===');
      console.log('Events | URL Length | Avg/Event');
      console.log('-------|------------|----------');
      
      // Show every 10th measurement
      measurements.filter((_, i) => i % 10 === 9).forEach(m => {
        console.log(`${m.eventCount.toString().padStart(6)} | ${m.urlLength.toString().padStart(10)} | ${m.avgPerEvent.toFixed(1).padStart(8)}`);
      });
      
      expect(measurements.length).toBe(100);
    });
  });

  describe('Maximum Events per URL Limit', () => {
    it('should find maximum events for various URL length limits', () => {
      const results = {};
      
      Object.entries(URL_LIMITS).forEach(([limitName, maxLength]) => {
        let eventCount = 0;
        let events = [];
        let lastValidLength = 0;
        
        // Binary search would be faster, but linear is clearer for testing
        while (true) {
          const mixedSet = generateMixedEventSet(eventCount);
          const testEvents = [...events, ...mixedSet];
          const encoded = encodeState(testEvents, null);
          
          if (encoded.length > maxLength) {
            break;
          }
          
          events = testEvents;
          lastValidLength = encoded.length;
          eventCount++;
          
          // Safety limit
          if (eventCount > 10000) break;
        }
        
        results[limitName] = {
          maxLength: maxLength,
          maxEvents: events.length,
          actualUrlLength: lastValidLength,
          utilizationPercent: ((lastValidLength / maxLength) * 100).toFixed(1)
        };
      });
      
      console.log('\n=== Maximum Events per URL Limit ===');
      console.log('Limit Name       | Max URL | Max Events | Actual URL | Utilization');
      console.log('-----------------|---------|------------|------------|------------');
      
      Object.entries(results).forEach(([name, info]) => {
        console.log(
          `${name.padEnd(16)} | ${info.maxLength.toString().padStart(7)} | ` +
          `${info.maxEvents.toString().padStart(10)} | ${info.actualUrlLength.toString().padStart(10)} | ` +
          `${info.utilizationPercent.padStart(10)}%`
        );
      });
      
      // Verify we found valid limits
      Object.values(results).forEach(info => {
        expect(info.maxEvents).toBeGreaterThan(0);
        expect(info.actualUrlLength).toBeLessThanOrEqual(info.maxLength);
      });
      
      return results;
    });
  });

  describe('Event Type Specific Limits', () => {
    it('should find max events for each event type individually', () => {
      const targetLimit = URL_LIMITS.PRACTICAL; // 4000 chars
      const results = {};
      
      ['feeding', 'peeing', 'pooping'].forEach(eventType => {
        let events = [];
        let lastValidLength = 0;
        let index = 0;
        
        while (true) {
          const event = eventGenerators[eventType](index);
          const testEvents = [...events, event];
          const encoded = encodeState(testEvents, null);
          
          if (encoded.length > targetLimit) {
            break;
          }
          
          events = testEvents;
          lastValidLength = encoded.length;
          index++;
          
          if (index > 1000) break;
        }
        
        results[eventType] = {
          maxEvents: events.length,
          actualUrlLength: lastValidLength,
          avgPerEvent: events.length > 0 ? (lastValidLength / events.length).toFixed(1) : 0
        };
      });
      
      console.log(`\n=== Max Events per Type (URL limit: ${targetLimit}) ===`);
      console.log('Event Type | Max Events | URL Length | Avg/Event');
      console.log('-----------|------------|------------|----------');
      
      Object.entries(results).forEach(([type, info]) => {
        console.log(
          `${type.padEnd(10)} | ${info.maxEvents.toString().padStart(10)} | ` +
          `${info.actualUrlLength.toString().padStart(10)} | ${info.avgPerEvent.toString().padStart(8)}`
        );
      });
      
      // Peeing should allow more events (smaller data)
      expect(results.peeing.maxEvents).toBeGreaterThan(results.feeding.maxEvents);
    });
  });

  describe('With Config Included', () => {
    it('should measure impact of including config in URL', () => {
      const withoutConfig = encodeState([], null);
      const withConfig = encodeState([], sampleConfig);
      
      console.log('\n=== Config Impact on URL Length ===');
      console.log(`Empty state without config: ${withoutConfig.length} chars`);
      console.log(`Empty state with config: ${withConfig.length} chars`);
      console.log(`Config overhead: ${withConfig.length - withoutConfig.length} chars`);
      
      // Now test with events
      const events = [];
      for (let i = 0; i < 10; i++) {
        events.push(...generateMixedEventSet(i));
      }
      
      const eventsWithoutConfig = encodeState(events, null);
      const eventsWithConfig = encodeState(events, sampleConfig);
      
      console.log(`\n30 events without config: ${eventsWithoutConfig.length} chars`);
      console.log(`30 events with config: ${eventsWithConfig.length} chars`);
      console.log(`Config overhead: ${eventsWithConfig.length - eventsWithoutConfig.length} chars`);
      
      expect(withConfig.length).toBeGreaterThan(withoutConfig.length);
    });

    it('should find max events when config is included', () => {
      const targetLimit = URL_LIMITS.PRACTICAL;
      let events = [];
      let lastValidLength = 0;
      let setIndex = 0;
      
      while (true) {
        const mixedSet = generateMixedEventSet(setIndex);
        const testEvents = [...events, ...mixedSet];
        const encoded = encodeState(testEvents, sampleConfig);
        
        if (encoded.length > targetLimit) {
          break;
        }
        
        events = testEvents;
        lastValidLength = encoded.length;
        setIndex++;
        
        if (setIndex > 1000) break;
      }
      
      console.log(`\n=== Max Events with Config (URL limit: ${targetLimit}) ===`);
      console.log(`Max events: ${events.length}`);
      console.log(`URL length: ${lastValidLength}`);
      
      expect(events.length).toBeGreaterThan(0);
    });
  });

  describe('Encoding/Decoding Roundtrip', () => {
    it('should correctly encode and decode large event sets', () => {
      const events = [];
      for (let i = 0; i < 50; i++) {
        events.push(...generateMixedEventSet(i));
      }
      
      const encoded = encodeState(events, sampleConfig);
      const decoded = decodeState(encoded);
      
      console.log('\n=== Roundtrip Test (150 events) ===');
      console.log(`Original events: ${events.length}`);
      console.log(`Encoded length: ${encoded.length}`);
      console.log(`Decoded events: ${decoded.data.length}`);
      
      expect(decoded.data.length).toBe(events.length);
      expect(decoded.config).toEqual(sampleConfig);
      
      // Verify data integrity
      expect(decoded.data[0]).toEqual(events[0]);
      expect(decoded.data[events.length - 1]).toEqual(events[events.length - 1]);
    });
  });

  describe('Summary Report', () => {
    it('should generate a comprehensive summary report', () => {
      console.log('\n' + '='.repeat(60));
      console.log('URL EVENT STORAGE CAPACITY SUMMARY');
      console.log('='.repeat(60));
      
      // Calculate average event size
      const sampleEvents = [
        ...generateMixedEventSet(0),
        ...generateMixedEventSet(1),
        ...generateMixedEventSet(2)
      ];
      const sampleEncoded = encodeState(sampleEvents, null);
      const avgPerEvent = sampleEncoded.length / sampleEvents.length;
      
      console.log(`\nAverage URL characters per event: ~${avgPerEvent.toFixed(0)}`);
      console.log('\nRecommended limits:');
      
      const recommendations = [
        { scenario: 'Safe for all browsers/sharing', limit: 2000, events: Math.floor(2000 / avgPerEvent) },
        { scenario: 'Practical everyday use', limit: 4000, events: Math.floor(4000 / avgPerEvent) },
        { scenario: 'Modern browsers only', limit: 8000, events: Math.floor(8000 / avgPerEvent) },
        { scenario: 'Chrome/Firefox power users', limit: 32000, events: Math.floor(32000 / avgPerEvent) },
      ];
      
      recommendations.forEach(r => {
        console.log(`  ${r.scenario}: ~${r.events * 3} events (${r.limit} char limit)`);
      });
      
      console.log('\nNote: Actual capacity varies based on event content length.');
      console.log('Peeing events are smallest, feeding events with descriptions are largest.');
      console.log('='.repeat(60) + '\n');
      
      expect(avgPerEvent).toBeGreaterThan(0);
    });
  });
});
