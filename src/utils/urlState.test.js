import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encodeState, decodeState, updateUrlState, getStateFromUrl } from './urlState';

describe('urlState', () => {
  describe('encodeState/decodeState', () => {
    it('should encode and decode correctly', () => {
      const data = [{ id: 1, type: 'test' }];
      const config = { setting: 'on' };
      
      const encoded = encodeState(data, config);
      expect(encoded).toBeTruthy();
      
      const decoded = decodeState(encoded);
      expect(decoded.data).toEqual(data);
      expect(decoded.config).toEqual(config);
    });

    it('should handle empty data', () => {
      const encoded = encodeState([], null);
      const decoded = decodeState(encoded);
      expect(decoded.data).toEqual([]);
      expect(decoded.config).toBeNull();
    });

    it('should handle malformed string', () => {
        const decoded = decodeState('invalid-base64');
        expect(decoded.data).toEqual([]);
        expect(decoded.config).toBeNull();
    });
  });

  describe('URL interaction', () => {
    beforeEach(() => {
        // Mock window.location and history
        delete window.location;
        window.location = { hash: '' };
        window.history.replaceState = vi.fn();
    });

    it('updateUrlState should update hash and history', () => {
        const data = [];
        const config = {};
        updateUrlState(data, config);
        
        expect(window.location.hash).not.toBe('');
        expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('getStateFromUrl should read from hash', () => {
        const data = [{ a: 1 }];
        const encoded = encodeState(data, null);
        window.location.hash = `#${encoded}`;
        
        const state = getStateFromUrl();
        expect(state.data).toEqual(data);
    });
  });
});
