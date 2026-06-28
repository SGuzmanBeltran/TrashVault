import type { Elysia } from 'elysia';
import { INTEGRATION_TEST_USER_ID } from './setup';

export async function integrationRequest(
  app: Elysia,
  path: string,
  options: RequestInit & { userId?: string } = {},
): Promise<Response> {
  const { userId = INTEGRATION_TEST_USER_ID, headers: initHeaders, ...init } = options;
  const headers = new Headers(initHeaders);
  headers.set('x-test-user-id', userId);

  return app.handle(
    new Request(`http://localhost${path}`, {
      ...init,
      headers,
    }),
  );
}

export async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}
