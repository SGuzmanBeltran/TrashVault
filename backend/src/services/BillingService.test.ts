import { afterEach, describe, expect, test } from 'bun:test';
import { BillingService } from './BillingService.service';
import type { StatsData } from './StatsService.service';
import { ServiceError } from '../errors';

class MockStatsService {
  constructor(private stats: StatsData) {}

  async getStats(): Promise<StatsData> {
    return this.stats;
  }

  async upgradeStorage(): Promise<StatsData> {
    return this.stats;
  }
}

const baseStats: StatsData = {
  totalFiles: 0,
  totalFolders: 0,
  usedBytes: 0,
  maxBytes: 500 * 1024 * 1024,
  storageTier: 'free',
  recentFiles: [],
};

describe('BillingService', () => {
  let stripeKey: string | undefined;

  afterEach(() => {
    if (stripeKey === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = stripeKey;
    }
  });

  test('createCheckoutSession rejects free tier', async () => {
    stripeKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const service = new BillingService(new MockStatsService(baseStats) as never);
    await expect(service.createCheckoutSession('user-1', 'a@b.com', 'free')).rejects.toThrow(
      'paid storage plan',
    );
  });

  test('createCheckoutSession rejects downgrades', async () => {
    stripeKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const service = new BillingService(
      new MockStatsService({ ...baseStats, storageTier: 'pro' }) as never,
    );

    await expect(service.createCheckoutSession('user-1', 'a@b.com', 'plus')).rejects.toThrow(
      'larger plan',
    );
  });

  test('createCheckoutSession requires stripe configuration for paid tiers', async () => {
    stripeKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const service = new BillingService(new MockStatsService(baseStats) as never);
    await expect(service.createCheckoutSession('user-1', 'a@b.com', 'plus')).rejects.toThrow(
      ServiceError,
    );
    await expect(service.createCheckoutSession('user-1', 'a@b.com', 'plus')).rejects.toThrow(
      'Billing is not configured',
    );
  });

  test('handleWebhook requires webhook secret', async () => {
    stripeKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';

    const previousWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const service = new BillingService(new MockStatsService(baseStats) as never);

    try {
      await expect(service.handleWebhook('{}', 'sig')).rejects.toThrow(
        'Stripe webhook is not configured',
      );
    } finally {
      if (previousWebhookSecret === undefined) {
        delete process.env.STRIPE_WEBHOOK_SECRET;
      } else {
        process.env.STRIPE_WEBHOOK_SECRET = previousWebhookSecret;
      }
    }
  });
});
