import Stripe from 'stripe';
import {
  BillingPort,
  BillingWebhookEvent,
  CheckoutSessionParams,
  CheckoutSessionResult,
} from '../../ports/billing/Billing.port';
import { ServiceError } from '../../errors';

export class StripeBillingAdapter implements BillingPort {
  private stripe: Stripe | null;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    this.stripe = secretKey ? new Stripe(secretKey) : null;
  }

  private requireStripe(): Stripe {
    if (!this.stripe) {
      throw new ServiceError(503, 'Billing is not configured.');
    }
    return this.stripe;
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    const stripe = this.requireStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: params.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Trashvault ${params.tierName}`,
              description: params.tierTagline,
            },
            unit_amount: params.priceMonthlyCents,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: params.userId,
        tierId: params.tierId,
      },
      subscription_data: {
        metadata: {
          userId: params.userId,
          tierId: params.tierId,
        },
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    if (!session.url) {
      throw new ServiceError(500, 'Failed to create checkout session.');
    }

    return { checkoutUrl: session.url };
  }

  async parseWebhookEvent(rawBody: string, signature: string): Promise<BillingWebhookEvent | null> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new ServiceError(503, 'Stripe webhook is not configured.');
    }

    const stripe = this.requireStripe();
    const event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);

    if (event.type !== 'checkout.session.completed') {
      return null;
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const tierId = session.metadata?.tierId;

    if (!userId || !tierId) {
      return null;
    }

    return {
      type: 'checkout.session.completed',
      userId,
      tierId,
    };
  }
}
