import { Elysia } from 'elysia';
import { auth } from '../../auth';

export const authMacro = new Elysia({ name: 'auth-macro' })
  .macro({
    auth: {
      async resolve({ request: { headers } }) {
        const session = await auth.api.getSession({ headers });

        return {
          user: session?.user ?? null,
          session: session?.session ?? null,
        };
      },
      beforeHandle({ user, set }) {
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
