
/**
 * Waits for a specified amount of time
 * @param ms - Time to wait in milliseconds
 * @returns Promise that resolves after the specified time
 */
export function delay(ms: number): Promise<boolean> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, ms);
    });
}
