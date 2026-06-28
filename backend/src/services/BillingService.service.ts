import { getStorageTier, type StorageTierId } from '../lib/storageTiers';
import type { BillingPort } from '../ports/billing/Billing.port';
import { StatsService } from './StatsService.service';
import { ServiceError } from '../errors';

export class BillingService {
  constructor(
    private statsService: StatsService,
    private billingPort: BillingPort,
  ) {}

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

    return this.billingPort.createCheckoutSession({
      userId,
      email,
      tierId: tier.id,
      tierName: tier.name,
      tierTagline: tier.tagline,
      priceMonthlyCents: tier.priceMonthly * 100,
      successUrl: `${frontendUrl}/settings?billing=success`,
      cancelUrl: `${frontendUrl}/settings?billing=cancelled`,
    });
  }

  async handleWebhook(rawBody: string, signature: string): Promise<{ received: true }> {
    const event = await this.billingPort.parseWebhookEvent(rawBody, signature);

    if (event?.type === 'checkout.session.completed') {
      await this.statsService.upgradeStorage(event.userId, event.tierId as StorageTierId);
    }

    return { received: true };
  }
}
