/**
 * @param {number} a
 * @param {number} b
 */
export const range = (a, b) =>
  Array(b - a)
    .fill(0)
    .map((_, i) => a + i);

/**
 * @param {number} a
 * @param {number} x
 * @param {number} b
 */
export const inRange = (a, x, b) => a <= x && x < b;

/**
 * @param {number} a
 * @param {number} x
 * @param {number} b
 */
export const clamp = (a, x, b) => Math.max(a, Math.min(x, b));
