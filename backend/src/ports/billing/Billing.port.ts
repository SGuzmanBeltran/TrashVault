export interface CheckoutSessionParams {
  userId: string;
  email: string;
  tierId: string;
  tierName: string;
  tierTagline: string;
  priceMonthlyCents: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  checkoutUrl: string;
}

export interface BillingCheckoutCompletedEvent {
  type: 'checkout.session.completed';
  userId: string;
  tierId: string;
}

export type BillingWebhookEvent = BillingCheckoutCompletedEvent;

export interface BillingPort {
  createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult>;
  parseWebhookEvent(rawBody: string, signature: string): Promise<BillingWebhookEvent | null>;
}
