import { eq } from 'drizzle-orm';
import { auth } from '../auth';
import { createVaultKeyMaterial } from '../lib/vaultCrypto';
import { db } from './index';
import { user } from './auth-schema';
import { userEncryptionKeys } from './schema';

export const DEMO_USER = {
  email: 'demo@trashvault.dev',
  password: 'password123',
  name: 'Demo User',
} as const;

async function getDemoUserId(): Promise<string> {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, DEMO_USER.email))
    .limit(1);

  if (existing.length > 0) {
    return existing[0]!.id;
  }

  await auth.api.signUpEmail({
    body: {
      email: DEMO_USER.email,
      password: DEMO_USER.password,
      name: DEMO_USER.name,
    },
  });

  const created = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, DEMO_USER.email))
    .limit(1);

  if (created.length === 0) {
    throw new Error('Failed to seed demo user');
  }

  console.log(`Demo user seeded (${DEMO_USER.email})`);
  return created[0]!.id;
}

async function seedDemoEncryptionKey(userId: string): Promise<void> {
  const existing = await db
    .select({ userId: userEncryptionKeys.userId })
    .from(userEncryptionKeys)
    .where(eq(userEncryptionKeys.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return;
  }

  const keyMaterial = await createVaultKeyMaterial(DEMO_USER.password);

  await db.insert(userEncryptionKeys).values({
    userId,
    ...keyMaterial,
  });

  console.log(`Demo vault key seeded for ${DEMO_USER.email}`);
}

export async function seedDemoUser(): Promise<void> {
  const userId = await getDemoUserId();
  await seedDemoEncryptionKey(userId);
}
