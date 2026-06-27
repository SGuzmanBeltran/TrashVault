import Stripe from 'stripe';
import { getStorageTier, type StorageTierId } from '../lib/storageTiers';
import { StatsService } from './StatsService.service';
import { ServiceError } from '../errors';

export class BillingService {
  private stripe: Stripe | null;

  constructor(private statsService: StatsService) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    this.stripe = secretKey ? new Stripe(secretKey) : null;
  }

  private requireStripe(): Stripe {
    if (!this.stripe) {
      throw new ServiceError(503, 'Billing is not configured.');
    }
    return this.stripe;
  }

  async createCheckoutSession(
    userId: string,
    email: string,
    tierId: StorageTierId,
  ): Promise<{ checkoutUrl: string }> {
    const tier = getStorageTier(tierId);
    if (tier.id === 'free') {
      throw new ServiceError(400, 'Choose a paid storage plan to upgrade.');
    }

    const stats = await this.statsService.getStats(userId);
    const currentTier = getStorageTier(stats.storageTier);
    if (tier.maxBytes <= currentTier.maxBytes) {
      throw new ServiceError(400, 'You can only upgrade to a larger plan.');
    }

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const stripe = this.requireStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Trashvault ${tier.name}`,
              description: tier.tagline,
            },
            unit_amount: tier.priceMonthly * 100,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        tierId: tier.id,
      },
      subscription_data: {
        metadata: {
          userId,
          tierId: tier.id,
        },
      },
      success_url: `${frontendUrl}/settings?billing=success`,
      cancel_url: `${frontendUrl}/settings?billing=cancelled`,
    });

    if (!session.url) {
      throw new ServiceError(500, 'Failed to create checkout session.');
    }

    return { checkoutUrl: session.url };
  }

  async handleWebhook(rawBody: string, signature: string): Promise<{ received: true }> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new ServiceError(503, 'Stripe webhook is not configured.');
    }

    const stripe = this.requireStripe();
    const event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const tierId = session.metadata?.tierId;

      if (userId && tierId) {
        await this.statsService.upgradeStorage(userId, tierId as StorageTierId);
      }
    }

    return { received: true };
  }
}
