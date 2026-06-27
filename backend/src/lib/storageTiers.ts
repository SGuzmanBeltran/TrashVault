export type StorageTierId = 'free' | 'plus' | 'pro' | 'whale';

export interface StorageTier {
  id: StorageTierId;
  name: string;
  tagline: string;
  maxBytes: number;
  priceMonthly: number;
}

export const STORAGE_TIERS: StorageTier[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Barely enough to try the app',
    maxBytes: 500 * 1024 * 1024,
    priceMonthly: 0,
  },
  {
    id: 'plus',
    name: 'Plus',
    tagline: '5 GB for the dangerously optimistic',
    maxBytes: 5 * 1024 * 1024 * 1024,
    priceMonthly: 49,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: '10 GB — because you hate money',
    maxBytes: 10 * 1024 * 1024 * 1024,
    priceMonthly: 199,
  },
  {
    id: 'whale',
    name: 'Whale',
    tagline: '25 GB. Please seek help.',
    maxBytes: 25 * 1024 * 1024 * 1024,
    priceMonthly: 999,
  },
];

export const UPGRADEABLE_TIER_IDS = ['plus', 'pro', 'whale'] as const;

export function getStorageTier(id: string): StorageTier {
  return STORAGE_TIERS.find((tier) => tier.id === id) ?? STORAGE_TIERS[0];
}

export function listUpgradeableTiers(): StorageTier[] {
  return STORAGE_TIERS.filter((tier) => tier.id !== 'free');
}
