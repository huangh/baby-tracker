import { describe, it, expect } from 'vitest';
import { calculateQuadraticRegression, evaluateQuadratic, generateTrendLinePoints } from './polynomialRegression';

describe('polynomialRegression', () => {
  describe('calculateQuadraticRegression', () => {
    it('should return null if fewer than 3 points', () => {
      const points = [{ x: 1, y: 1 }, { x: 2, y: 4 }];
      expect(calculateQuadraticRegression(points)).toBeNull();
    });

    it('should calculate coefficients correctly for y = x^2', () => {
      // Points on y = x^2: (1,1), (2,4), (3,9)
      // a=1, b=0, c=0
      const points = [{ x: 1, y: 1 }, { x: 2, y: 4 }, { x: 3, y: 9 }];
      const coeffs = calculateQuadraticRegression(points);
      expect(coeffs).not.toBeNull();
      // Allow some floating point error
      expect(coeffs[0]).toBeCloseTo(1);
      expect(coeffs[1]).toBeCloseTo(0);
      expect(coeffs[2]).toBeCloseTo(0);
    });

    it('should calculate coefficients correctly for y = 2x^2 + 3x + 4', () => {
        // x=0 -> 4
        // x=1 -> 2+3+4 = 9
        // x=2 -> 8+6+4 = 18
        const points = [{ x: 0, y: 4 }, { x: 1, y: 9 }, { x: 2, y: 18 }];
        const coeffs = calculateQuadraticRegression(points);
        expect(coeffs).not.toBeNull();
        expect(coeffs[0]).toBeCloseTo(2);
        expect(coeffs[1]).toBeCloseTo(3);
        expect(coeffs[2]).toBeCloseTo(4);
    });
  });

  describe('evaluateQuadratic', () => {
    it('should evaluate y correctly given x and coefficients', () => {
      // y = 2x^2 + 3x + 4
      const coeffs = [2, 3, 4];
      expect(evaluateQuadratic(0, coeffs)).toBe(4);
      expect(evaluateQuadratic(1, coeffs)).toBe(9);
      expect(evaluateQuadratic(2, coeffs)).toBe(18);
    });

    it('should return 0 if coefficients are invalid', () => {
      expect(evaluateQuadratic(1, [])).toBe(0);
      expect(evaluateQuadratic(1, null)).toBe(0);
    });
  });

  describe('generateTrendLinePoints', () => {
    it('should generate correct number of points', () => {
        const coeffs = [1, 0, 0]; // y = x^2
        const points = generateTrendLinePoints(0, 10, coeffs, 11);
        expect(points.length).toBe(11);
        expect(points[0].x).toBe(0);
        expect(points[10].x).toBe(10);
    });

    it('should return empty array if coefficients are missing', () => {
        expect(generateTrendLinePoints(0, 10, null)).toEqual([]);
    });
  });
});
