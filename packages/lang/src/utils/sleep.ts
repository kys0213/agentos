/**
 * Sleep for a given number of milliseconds.
 * @param ms - The number of milliseconds to sleep.
 * @returns A promise that resolves when the sleep is complete.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
