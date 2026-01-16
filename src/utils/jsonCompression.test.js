import { describe, it, expect } from 'vitest';
import { compressAndEncode, decodeAndDecompress } from './jsonCompression';

describe('JSON Compression Utility', () => {
  const exampleData = {
    user: {
      id: 'user_123456',
      name: 'Test User',
      settings: {
        theme: 'dark',
        notifications: true
      }
    },
    events: Array.from({ length: 50 }, (_, i) => ({
      id: `evt_${i}`,
      type: i % 3 === 0 ? 'feeding' : (i % 3 === 1 ? 'sleeping' : 'diaper'),
      timestamp: new Date(2023, 0, 1, 10, 0, 0).getTime() + i * 3600000,
      details: {
        amount: i % 3 === 0 ? 150 : null,
        duration: i % 3 === 1 ? 45 : null,
        condition: i % 3 === 2 ? 'wet' : null
      }
    }))
  };

  it('should compress and decompress data correctly', () => {
    const compressed = compressAndEncode(exampleData);
    expect(compressed).toBeDefined();
    expect(typeof compressed).toBe('string');
    expect(compressed.length).toBeGreaterThan(0);

    const decompressed = decodeAndDecompress(compressed);
    expect(decompressed).toEqual(exampleData);
  });

  it('should handle null or empty input gracefully', () => {
    const nullCompressed = compressAndEncode(null);
    expect(decodeAndDecompress(nullCompressed)).toBeNull();
    
    expect(decodeAndDecompress('')).toBeNull();
    expect(decodeAndDecompress(null)).toBeNull();
  });

  it('should demonstrate compression ratio', () => {
    const jsonString = JSON.stringify(exampleData);
    const originalSize = jsonString.length;
    
    const compressed = compressAndEncode(exampleData);
    const compressedSize = compressed.length;
    
    const ratio = (1 - (compressedSize / originalSize)) * 100;
    
    console.log(`
      Original Size: ${originalSize} chars
      Compressed Size: ${compressedSize} chars
      Compression Ratio: ${ratio.toFixed(2)}% reduction
    `);

    // We expect some compression for this data
    expect(compressedSize).toBeLessThan(originalSize);
  });

  it('should handle special characters', () => {
    const specialData = {
      text: "Hello 🌍! This includes symbols @#$%^&*() and emojis 🎉"
    };
    
    const compressed = compressAndEncode(specialData);
    const decompressed = decodeAndDecompress(compressed);
    
    expect(decompressed).toEqual(specialData);
  });
});
