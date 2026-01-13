import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encodeState, decodeState, updateUrlState, getStateFromUrl } from './urlState';

describe('urlState', () => {
  describe('encodeState/decodeState', () => {
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
      
      const encoded = encodeState(mockEvents, null);
      
      // Verify it returns a string
      expect(typeof encoded).toBe('string');
      expect(encoded).toBeTruthy();
      
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
      expect(decoded.config).toBeNull();
    });

    it('should handle malformed string gracefully', () => {
      const decoded = decodeState('invalid-base64');
      expect(decoded.data).toEqual([]);
      expect(decoded.config).toBeNull();
    });
  });

  describe('URL interaction', () => {
    beforeEach(() => {
        // Mock window.location and history
        // We need to be careful with jsdom window object. 
        // Best practice is usually to not delete window properties if possible or restore them.
        // However, this is a test environment.
        
        // Simulating hash update
        window.location.hash = '';
        
        // Mock history.replaceState
        vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('updateUrlState should update hash and history', () => {
        const data = [];
        const config = null;
        updateUrlState(data, config);
        
        expect(window.location.hash).not.toBe('');
        expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('getStateFromUrl should read from hash', () => {
        const data = [{ id: 'test' }];
        const encoded = encodeState(data, null);
        window.location.hash = `#${encoded}`;
        
        const state = getStateFromUrl();
        expect(state.data).toEqual(data);
    });
  });
});
