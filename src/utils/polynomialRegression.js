/**
 * Polynomial Regression Utilities
 * Calculate quadratic (degree 2) polynomial regression
 */

/**
 * Calculate quadratic polynomial regression coefficients
 * Formula: y = ax² + bx + c
 * Returns coefficients [a, b, c]
 * 
 * @param {Array} points - Array of {x, y} points
 * @returns {Array|null} [a, b, c] coefficients or null if insufficient data
 */
export function calculateQuadraticRegression(points) {
  if (!points || points.length < 3) {
    return null; // Need at least 3 points for quadratic regression
  }
  
  const n = points.length;
  let sumX = 0, sumY = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0, sumXY = 0, sumX2Y = 0;
  
  // Calculate sums
  for (const point of points) {
    const x = point.x;
    const y = point.y;
    const x2 = x * x;
    const x3 = x2 * x;
    const x4 = x3 * x;
    
    sumX += x;
    sumY += y;
    sumX2 += x2;
    sumX3 += x3;
    sumX4 += x4;
    sumXY += x * y;
    sumX2Y += x2 * y;
  }
  
  // Solve system of equations using Cramer's rule for 3x3 system
  // Matrix form: [n   sumX  sumX2]   [c]   [sumY  ]
  //              [sumX sumX2 sumX3] * [b] = [sumXY ]
  //              [sumX2 sumX3 sumX4]  [a]   [sumX2Y]
  
  const det = n * (sumX2 * sumX4 - sumX3 * sumX3) 
            - sumX * (sumX * sumX4 - sumX3 * sumX2) 
            + sumX2 * (sumX * sumX3 - sumX2 * sumX2);
  
  if (Math.abs(det) < 1e-10) {
    return null; // Matrix is singular, cannot solve
  }
  
  const detC = sumY * (sumX2 * sumX4 - sumX3 * sumX3)
             - sumXY * (sumX * sumX4 - sumX3 * sumX2)
             + sumX2Y * (sumX * sumX3 - sumX2 * sumX2);
  
  const detB = n * (sumXY * sumX4 - sumX3 * sumX2Y)
             - sumY * (sumX * sumX4 - sumX3 * sumX2)
             + sumX2 * (sumX * sumX2Y - sumXY * sumX2);
  
  const detA = n * (sumX2 * sumX2Y - sumX3 * sumXY)
             - sumX * (sumX * sumX2Y - sumXY * sumX2)
             + sumY * (sumX * sumX3 - sumX2 * sumX2);
  
  const a = detA / det;
  const b = detB / det;
  const c = detC / det;
  
  return [a, b, c];
}

/**
 * Evaluate quadratic polynomial at given x value
 * @param {number} x - X value
 * @param {Array} coefficients - [a, b, c] coefficients
 * @returns {number} Y value
 */
export function evaluateQuadratic(x, coefficients) {
  if (!coefficients || coefficients.length !== 3) return 0;
  const [a, b, c] = coefficients;
  return a * x * x + b * x + c;
}

/**
 * Generate trend line points for plotting
 * @param {number} minX - Minimum X value
 * @param {number} maxX - Maximum X value
 * @param {Array} coefficients - [a, b, c] coefficients
 * @param {number} numPoints - Number of points to generate
 * @returns {Array} Array of {x, y} points
 */
export function generateTrendLinePoints(minX, maxX, coefficients, numPoints = 50) {
  if (!coefficients) return [];
  
  const points = [];
  const step = (maxX - minX) / (numPoints - 1);
  
  for (let i = 0; i < numPoints; i++) {
    const x = minX + i * step;
    const y = evaluateQuadratic(x, coefficients);
    points.push({ x, y });
  }
  
  return points;
}

