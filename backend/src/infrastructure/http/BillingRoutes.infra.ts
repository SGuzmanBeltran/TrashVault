import { Elysia, t } from 'elysia';
import { createBillingService } from '../di/container';
import { authMacro } from './auth.plugin';
import { ServiceError } from '../../errors';

export const billingRoutes = new Elysia({ prefix: '/billing' })
  .use(authMacro)
  .post('/checkout-session', async ({ user, body }) => {
    const billingService = createBillingService();
    return billingService.createCheckoutSession(user!.id, user!.email, body.tier);
  }, {
    auth: true,
    body: t.Object({
      tier: t.Union([
        t.Literal('plus'),
        t.Literal('pro'),
        t.Literal('whale'),
      ]),
    }),
  })
  .post('/webhook', async ({ request, set }) => {
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      set.status = 400;
      return { error: 'Missing stripe-signature header.' };
    }

    try {
      const billingService = createBillingService();
      const rawBody = await request.text();
      return await billingService.handleWebhook(rawBody, signature);
    } catch (error) {
      if (error instanceof ServiceError) {
        set.status = error.statusCode;
        return { error: error.message };
      }

      console.error('Stripe webhook error:', error);
      set.status = 400;
      return { error: 'Webhook verification failed.' };
    }
  });
