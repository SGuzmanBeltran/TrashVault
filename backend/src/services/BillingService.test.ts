import { describe, expect, test } from 'bun:test';
import { BillingService } from './BillingService.service';
import { StatsService } from './StatsService.service';
import { createMockBillingPort, createMockStatsRepository } from '../test/helpers/mocks';
import { ServiceError } from '../errors';

function createBillingService(deps: {
  statsRepository?: ReturnType<typeof createMockStatsRepository>;
  billingPort?: ReturnType<typeof createMockBillingPort>;
}) {
  const statsService = new StatsService(deps.statsRepository ?? createMockStatsRepository());
  return new BillingService(statsService, deps.billingPort ?? createMockBillingPort());
}

describe('BillingService', () => {
  test('createCheckoutSession rejects free tier', async () => {
    const service = createBillingService({});
    await expect(service.createCheckoutSession('user-1', 'a@b.com', 'free')).rejects.toThrow(
      'paid storage plan',
    );
  });

  test('createCheckoutSession rejects downgrades', async () => {
    const service = createBillingService({
      statsRepository: createMockStatsRepository({
        getUserStorageTier: async () => 'pro',
      }),
    });

    await expect(service.createCheckoutSession('user-1', 'a@b.com', 'plus')).rejects.toThrow(
      'larger plan',
    );
  });

  test('createCheckoutSession delegates to billing port for paid tiers', async () => {
    let receivedParams: Record<string, unknown> | null = null;

    const service = createBillingService({
      billingPort: createMockBillingPort({
        createCheckoutSession: async (params) => {
          receivedParams = params;
          return { checkoutUrl: 'https://checkout.stripe.test/cs_123' };
        },
      }),
    });

    const result = await service.createCheckoutSession('user-1', 'a@b.com', 'plus');

    expect(result.checkoutUrl).toBe('https://checkout.stripe.test/cs_123');
    expect(receivedParams).toMatchObject({
      userId: 'user-1',
      email: 'a@b.com',
      tierId: 'plus',
      tierName: 'Plus',
      priceMonthlyCents: 4900,
    });
  });

  test('createCheckoutSession surfaces billing configuration errors', async () => {
    const service = createBillingService({
      billingPort: createMockBillingPort({
        createCheckoutSession: async () => {
          throw new ServiceError(503, 'Billing is not configured.');
        },
      }),
    });

    await expect(service.createCheckoutSession('user-1', 'a@b.com', 'plus')).rejects.toThrow(
      'Billing is not configured',
    );
  });

  test('handleWebhook upgrades storage when checkout completes', async () => {
    let upgradedTier: string | null = null;

    const service = createBillingService({
      statsRepository: createMockStatsRepository({
        getUserStorageTier: async () => 'free',
        updateUserStorageTier: async (_userId, tierId) => {
          upgradedTier = tierId;
        },
      }),
      billingPort: createMockBillingPort({
        parseWebhookEvent: async () => ({
          type: 'checkout.session.completed',
          userId: 'user-1',
          tierId: 'plus',
        }),
      }),
    });

    const result = await service.handleWebhook('{}', 'sig');

    expect(result).toEqual({ received: true });
    expect(upgradedTier).toBe('plus');
  });

  test('handleWebhook ignores unrelated events', async () => {
    let upgradeCalled = false;

    const service = createBillingService({
      statsRepository: createMockStatsRepository({
        updateUserStorageTier: async () => {
          upgradeCalled = true;
        },
      }),
      billingPort: createMockBillingPort({
        parseWebhookEvent: async () => null,
      }),
    });

    await service.handleWebhook('{}', 'sig');
    expect(upgradeCalled).toBe(false);
  });

  test('handleWebhook surfaces webhook configuration errors', async () => {
    const service = createBillingService({
      billingPort: createMockBillingPort({
        parseWebhookEvent: async () => {
          throw new ServiceError(503, 'Stripe webhook is not configured.');
        },
      }),
    });

    await expect(service.handleWebhook('{}', 'sig')).rejects.toThrow(
      'Stripe webhook is not configured',
    );
  });
});
