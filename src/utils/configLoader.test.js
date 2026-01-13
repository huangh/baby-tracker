/**
 * Config Schema & Dynamic Form Generation Tests
 * 
 * HIGH IMPACT: Tests the config-driven architecture that powers the entire app.
 * The YAML config defines event types, fields, validation rules, and UI elements.
 * If config parsing or schema validation fails, the entire app breaks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEventTypeConfig } from './configLoader.js';

// Mock config that mirrors the structure from config.yaml
const mockConfig = {
  events: [
    {
      id: 'feeding',
      label: 'Feeding',
      fields: [
        {
          id: 'type',
          label: 'Type',
          type: 'select',
          required: true,
          options: [
            { value: 'breastmilk', label: 'Breastmilk' },
            { value: 'formula', label: 'Formula' },
            { value: 'bottle', label: 'Bottle' }
          ]
        },
        {
          id: 'amount',
          label: 'Amount (ml)',
          type: 'number',
          required: true,
          min: 0
        },
        {
          id: 'timestamp',
          label: 'Time',
          type: 'datetime',
          default: 'now',
          required: true
        }
      ]
    },
    {
      id: 'peeing',
      label: 'Peeing',
      fields: [
        {
          id: 'timestamp',
          label: 'Time',
          type: 'datetime',
          default: 'now',
          required: true
        }
      ]
    },
    {
      id: 'pooping',
      label: 'Pooping',
      fields: [
        {
          id: 'timestamp',
          label: 'Time',
          type: 'datetime',
          default: 'now',
          required: true
        },
        {
          id: 'consistency',
          label: 'Consistency',
          type: 'text',
          required: false,
          placeholder: 'Describe the consistency...'
        }
      ]
    }
  ]
};

describe('Config Schema Validation', () => {
  
  describe('Event Type Structure', () => {
    it('should have all required event types defined', () => {
      const requiredEventTypes = ['feeding', 'peeing', 'pooping'];
      
      requiredEventTypes.forEach(eventType => {
        const config = getEventTypeConfig(mockConfig, eventType);
        expect(config).not.toBeNull();
        expect(config.id).toBe(eventType);
        expect(config.label).toBeDefined();
        expect(config.fields).toBeDefined();
        expect(Array.isArray(config.fields)).toBe(true);
      });
    });

    it('should return null for unknown event types', () => {
      const config = getEventTypeConfig(mockConfig, 'unknown');
      expect(config).toBeNull();
    });

    it('should handle null/undefined config gracefully', () => {
      expect(getEventTypeConfig(null, 'feeding')).toBeNull();
      expect(getEventTypeConfig(undefined, 'feeding')).toBeNull();
      expect(getEventTypeConfig({}, 'feeding')).toBeNull();
      expect(getEventTypeConfig({ events: null }, 'feeding')).toBeNull();
    });
  });

  describe('Field Type Validation', () => {
    const validFieldTypes = ['datetime', 'select', 'number', 'text'];
    
    it('should only contain valid field types', () => {
      mockConfig.events.forEach(eventType => {
        eventType.fields.forEach(field => {
          expect(validFieldTypes).toContain(field.type);
        });
      });
    });

    it('should have all datetime fields across event types', () => {
      mockConfig.events.forEach(eventType => {
        const timestampField = eventType.fields.find(f => f.id === 'timestamp');
        expect(timestampField).toBeDefined();
        expect(timestampField.type).toBe('datetime');
        expect(timestampField.required).toBe(true);
      });
    });

    it('should have select fields with valid options', () => {
      const feedingConfig = getEventTypeConfig(mockConfig, 'feeding');
      const typeField = feedingConfig.fields.find(f => f.id === 'type');
      
      expect(typeField.type).toBe('select');
      expect(typeField.options).toBeDefined();
      expect(Array.isArray(typeField.options)).toBe(true);
      expect(typeField.options.length).toBeGreaterThan(0);
      
      typeField.options.forEach(option => {
        expect(option.value).toBeDefined();
        expect(option.label).toBeDefined();
      });
    });

    it('should have number fields with proper constraints', () => {
      const feedingConfig = getEventTypeConfig(mockConfig, 'feeding');
      const amountField = feedingConfig.fields.find(f => f.id === 'amount');
      
      expect(amountField.type).toBe('number');
      expect(amountField.min).toBeDefined();
      expect(typeof amountField.min).toBe('number');
    });
  });

  describe('Required Field Validation', () => {
    it('should properly mark required fields', () => {
      mockConfig.events.forEach(eventType => {
        const requiredFields = eventType.fields.filter(f => f.required);
        const optionalFields = eventType.fields.filter(f => !f.required);
        
        // Every event type should have at least one required field (timestamp)
        expect(requiredFields.length).toBeGreaterThan(0);
        
        // Verify timestamp is always required
        const timestampField = eventType.fields.find(f => f.id === 'timestamp');
        expect(timestampField.required).toBe(true);
      });
    });

    it('should have optional consistency field only for pooping', () => {
      const poopingConfig = getEventTypeConfig(mockConfig, 'pooping');
      const consistencyField = poopingConfig.fields.find(f => f.id === 'consistency');
      
      expect(consistencyField).toBeDefined();
      expect(consistencyField.required).toBe(false);
      
      // Other event types shouldn't have consistency
      const feedingConfig = getEventTypeConfig(mockConfig, 'feeding');
      const peeingConfig = getEventTypeConfig(mockConfig, 'peeing');
      
      expect(feedingConfig.fields.find(f => f.id === 'consistency')).toBeUndefined();
      expect(peeingConfig.fields.find(f => f.id === 'consistency')).toBeUndefined();
    });
  });

  describe('Default Value Handling', () => {
    it('should have "now" as default for all timestamp fields', () => {
      mockConfig.events.forEach(eventType => {
        const timestampField = eventType.fields.find(f => f.id === 'timestamp');
        expect(timestampField.default).toBe('now');
      });
    });
  });
});

describe('Form Generation Logic', () => {
  
  describe('Dynamic Field Generation', () => {
    it('should generate correct field count for each event type', () => {
      const expectedFieldCounts = {
        feeding: 3,   // type, amount, timestamp
        peeing: 1,    // timestamp
        pooping: 2    // timestamp, consistency
      };
      
      Object.entries(expectedFieldCounts).forEach(([eventType, expectedCount]) => {
        const config = getEventTypeConfig(mockConfig, eventType);
        expect(config.fields.length).toBe(expectedCount);
      });
    });

    it('should have unique field IDs within each event type', () => {
      mockConfig.events.forEach(eventType => {
        const fieldIds = eventType.fields.map(f => f.id);
        const uniqueIds = [...new Set(fieldIds)];
        expect(fieldIds.length).toBe(uniqueIds.length);
      });
    });
  });

  describe('Event Type Selection', () => {
    it('should return complete event config for valid types', () => {
      const feedingConfig = getEventTypeConfig(mockConfig, 'feeding');
      
      expect(feedingConfig).toMatchObject({
        id: 'feeding',
        label: 'Feeding',
        fields: expect.any(Array)
      });
    });

    it('should support iterating over all event types', () => {
      const eventIds = mockConfig.events.map(e => e.id);
      expect(eventIds).toContain('feeding');
      expect(eventIds).toContain('peeing');
      expect(eventIds).toContain('pooping');
    });
  });
});

describe('Config Extension Support', () => {
  
  it('should support adding new event types', () => {
    const extendedConfig = {
      ...mockConfig,
      events: [
        ...mockConfig.events,
        {
          id: 'sleeping',
          label: 'Sleeping',
          fields: [
            {
              id: 'timestamp',
              label: 'Start Time',
              type: 'datetime',
              default: 'now',
              required: true
            },
            {
              id: 'duration',
              label: 'Duration (minutes)',
              type: 'number',
              required: false,
              min: 0
            }
          ]
        }
      ]
    };
    
    const sleepingConfig = getEventTypeConfig(extendedConfig, 'sleeping');
    expect(sleepingConfig).not.toBeNull();
    expect(sleepingConfig.id).toBe('sleeping');
  });

  it('should support custom field types in theory', () => {
    const customConfig = {
      events: [
        {
          id: 'custom',
          label: 'Custom Event',
          fields: [
            {
              id: 'rating',
              label: 'Rating',
              type: 'number',
              min: 1,
              max: 5,
              step: 1
            }
          ]
        }
      ]
    };
    
    const customEvent = getEventTypeConfig(customConfig, 'custom');
    const ratingField = customEvent.fields[0];
    
    expect(ratingField.min).toBe(1);
    expect(ratingField.max).toBe(5);
    expect(ratingField.step).toBe(1);
  });
});
