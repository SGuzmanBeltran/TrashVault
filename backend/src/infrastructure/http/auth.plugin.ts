import { Elysia } from 'elysia';
import { auth } from '../../auth';

export const authPlugin = new Elysia({ name: 'better-auth' })
  .mount(auth.handler)
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
