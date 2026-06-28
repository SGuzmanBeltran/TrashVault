import { describe, expect, test } from 'bun:test';
import { mapInParallel } from './mapInParallel';

describe('mapInParallel', () => {
  test('does nothing for empty input', async () => {
    const fn = async () => {
      throw new Error('should not run');
    };
    await mapInParallel([], 4, fn);
  });

  test('processes every item once', async () => {
    const items = [1, 2, 3, 4, 5];
    const seen: number[] = [];

    await mapInParallel(items, 2, async (item) => {
      seen.push(item);
    });

    expect(seen.sort((a, b) => a - b)).toEqual(items);
  });

  test('respects concurrency without skipping items', async () => {
    let inFlight = 0;
    let maxInFlight = 0;

    await mapInParallel([1, 2, 3, 4, 5, 6], 2, async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      inFlight -= 1;
    });

    expect(maxInFlight).toBeLessThanOrEqual(2);
    expect(maxInFlight).toBeGreaterThan(1);
  });
});
