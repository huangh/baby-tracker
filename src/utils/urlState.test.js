import { describe, it, expect } from 'vitest';
import { encodeState, decodeState } from './urlState';

describe('URL State Management', () => {
  it('should correctly encode and decode complex state', () => {
    const mockEvents = [
      {
        id: '123',
        eventType: 'feeding',
        timestamp: new Date('2023-01-01T12:00:00Z').toISOString(),
        amount: 150,
        type: 'formula'
      },
      {
        id: '124',
        eventType: 'pooping',
        timestamp: new Date('2023-01-01T14:00:00Z').toISOString(),
        consistency: 'seedy'
      }
    ];
    
    // Config is usually not stored in URL if passed as null, but we can test it too if needed.
    // The app passes null for config in updateUrlState (line 59 in App.jsx).
    const encoded = encodeState(mockEvents, null);
    
    // Verify it returns a string
    expect(typeof encoded).toBe('string');
    
    // Decode it back
    const decoded = decodeState(encoded);
    
    // Verify data matches
    expect(decoded.data).toHaveLength(2);
    expect(decoded.data[0]).toEqual(mockEvents[0]);
    expect(decoded.data[1]).toEqual(mockEvents[1]);
  });

  it('should handle empty state', () => {
    const encoded = encodeState([], null);
    const decoded = decodeState(encoded);
    expect(decoded.data).toEqual([]);
  });

  it('should handle malformed strings gracefully', () => {
    const decoded = decodeState('not-valid-base64');
    expect(decoded).toEqual({ data: [], config: null });
  });
});
