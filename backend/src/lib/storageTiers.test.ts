import { describe, expect, test } from 'bun:test';
import { getStorageTier, listUpgradeableTiers, STORAGE_TIERS } from './storageTiers';

describe('storageTiers', () => {
  test('getStorageTier returns matching tier', () => {
    expect(getStorageTier('pro').id).toBe('pro');
  });

  test('getStorageTier falls back to free for unknown ids', () => {
    expect(getStorageTier('unknown').id).toBe('free');
  });

  test('listUpgradeableTiers excludes free plan', () => {
    const tiers = listUpgradeableTiers();
    expect(tiers.every((tier) => tier.id !== 'free')).toBe(true);
    expect(tiers.length).toBe(STORAGE_TIERS.length - 1);
  });

  test('paid tiers increase storage limits', () => {
    const free = getStorageTier('free');
    const plus = getStorageTier('plus');
    const pro = getStorageTier('pro');
    const whale = getStorageTier('whale');

    expect(plus.maxBytes).toBeGreaterThan(free.maxBytes);
    expect(pro.maxBytes).toBeGreaterThan(plus.maxBytes);
    expect(whale.maxBytes).toBeGreaterThan(pro.maxBytes);
  });
});
