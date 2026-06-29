import { Elysia } from 'elysia';
import { auth } from '../../auth';

function resolveIntegrationTestAuth(headers: Headers) {
  if (process.env.ENABLE_INTEGRATION_TEST_AUTH !== 'true') {
    return null;
  }

  const userId = headers.get('x-test-user-id');
  if (!userId) {
    return null;
  }

  const now = new Date();
  return {
    user: {
      id: userId,
      email: `${userId}@integration.test`,
      name: 'Integration Test User',
      emailVerified: true,
      twoFactorEnabled: false,
      image: null,
      storageTier: 'free',
      createdAt: now,
      updatedAt: now,
    },
    session: {
      id: 'integration-test-session',
      userId,
      token: 'integration-test-token',
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    },
  };
}

export const authMacro = new Elysia({ name: 'auth-macro' })
  .macro({
    auth: {
      async resolve({ request: { headers } }) {
        const integrationAuth = resolveIntegrationTestAuth(headers);
        if (integrationAuth) {
          return integrationAuth;
        }

        const session = await auth.api.getSession({ headers });

        return {
          user: session?.user ?? null,
          session: session?.session ?? null,
        };
      },
      beforeHandle(ctx) {
        const { user, set } = ctx as typeof ctx & {
          user: { id: string } | null;
        };
        if (!user) {
          set.status = 401;
          return 'Unauthorized';
        }
      },
    },
  });

export const authPlugin = new Elysia({ name: 'better-auth' })
  .use(authMacro)
  .mount(auth.handler);
