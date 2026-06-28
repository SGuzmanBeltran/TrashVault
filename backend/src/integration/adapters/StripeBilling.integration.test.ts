import { describe, expect, test } from 'bun:test';
import { StripeBillingAdapter } from '../../adapters/billing/StripeBilling.adapter';
import { ServiceError } from '../../errors';

function isStripeIntegrationEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

describe.skipIf(!isStripeIntegrationEnabled())('integration: StripeBillingAdapter', () => {
  const adapter = new StripeBillingAdapter();

  test('createCheckoutSession returns a hosted checkout url', async () => {
    const result = await adapter.createCheckoutSession({
      userId: 'integration-test-user',
      email: 'integration-test@trashvault.local',
      tierId: 'plus',
      tierName: 'Plus',
      tierTagline: 'Integration test plan',
      priceMonthlyCents: 4900,
      successUrl: 'http://localhost:5173/settings?billing=success',
      cancelUrl: 'http://localhost:5173/settings?billing=cancelled',
    });

    expect(result.checkoutUrl).toStartWith('https://checkout.stripe.com/');
  });
});

describe('integration: StripeBillingAdapter configuration', () => {
  test('requires stripe secret key', async () => {
    const previousKey = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;

    const adapter = new StripeBillingAdapter();

    try {
      await expect(
        adapter.createCheckoutSession({
          userId: 'user-1',
          email: 'a@b.com',
          tierId: 'plus',
          tierName: 'Plus',
          tierTagline: 'Test',
          priceMonthlyCents: 4900,
          successUrl: 'http://localhost/success',
          cancelUrl: 'http://localhost/cancel',
        }),
      ).rejects.toThrow(ServiceError);
    } finally {
      if (previousKey === undefined) {
        delete process.env.STRIPE_SECRET_KEY;
      } else {
        process.env.STRIPE_SECRET_KEY = previousKey;
      }
    }
  });

  test('requires webhook secret for parseWebhookEvent', async () => {
    const previousKey = process.env.STRIPE_SECRET_KEY;
    const previousWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const adapter = new StripeBillingAdapter();

    try {
      await expect(adapter.parseWebhookEvent('{}', 'sig')).rejects.toThrow(
        'Stripe webhook is not configured',
      );
    } finally {
      if (previousKey === undefined) {
        delete process.env.STRIPE_SECRET_KEY;
      } else {
        process.env.STRIPE_SECRET_KEY = previousKey;
      }

      if (previousWebhookSecret === undefined) {
        delete process.env.STRIPE_WEBHOOK_SECRET;
      } else {
        process.env.STRIPE_WEBHOOK_SECRET = previousWebhookSecret;
      }
    }
  });
});
