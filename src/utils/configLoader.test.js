import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig, getEventTypeConfig } from './configLoader';

// Mock fetch
global.fetch = vi.fn();

describe('configLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should fetch and parse YAML', async () => {
      const yamlContent = `
events:
  - id: feeding
    label: Feeding
`;
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(yamlContent)
      });

      const config = await loadConfig();
      expect(config.events).toHaveLength(1);
      expect(config.events[0].id).toBe('feeding');
    });

    it('should throw error on fetch failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(loadConfig()).rejects.toThrow('Failed to load config: Not Found');
    });
  });

  describe('getEventTypeConfig', () => {
    const config = {
        events: [
            { id: 'feeding', label: 'Feeding' },
            { id: 'diaper', label: 'Diaper' }
        ]
    };

    it('should return correct event config', () => {
        expect(getEventTypeConfig(config, 'feeding')).toEqual(config.events[0]);
    });

    it('should return null if not found', () => {
        expect(getEventTypeConfig(config, 'sleep')).toBeNull();
    });
  });
});
