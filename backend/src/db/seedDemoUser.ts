import { eq } from 'drizzle-orm';
import { auth } from '../auth';
import { db } from './index';
import { user } from './auth-schema';

export const DEMO_USER = {
  email: 'demo@trashvault.dev',
  password: 'password123',
  name: 'Demo User',
} as const;

export async function seedDemoUser(): Promise<void> {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, DEMO_USER.email))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  await auth.api.signUpEmail({
    body: {
      email: DEMO_USER.email,
      password: DEMO_USER.password,
      name: DEMO_USER.name,
    },
  });

  console.log(`Demo user seeded (${DEMO_USER.email})`);
}
