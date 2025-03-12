/**
 * Generates a random delay within a specified range
 * @param min - Minimum delay in milliseconds
 * @param max - Maximum delay in milliseconds
 * @returns A random number between min and max
 */
export function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}