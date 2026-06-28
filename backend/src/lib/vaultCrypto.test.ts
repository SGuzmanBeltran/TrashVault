import { describe, expect, test } from 'bun:test';
import { ARGON2_PARAMS_JSON, createVaultKeyMaterial } from './vaultCrypto';

describe('vaultCrypto', () => {
  test('createVaultKeyMaterial returns argon2id metadata and base64 fields', async () => {
    const material = await createVaultKeyMaterial('demo-password');

    expect(material.kdfAlgorithm).toBe('argon2id');
    expect(material.kdfParams).toBe(ARGON2_PARAMS_JSON);
    expect(material.encryptedDek.length).toBeGreaterThan(0);
    expect(material.dekIv.length).toBeGreaterThan(0);
    expect(material.dekSalt.length).toBeGreaterThan(0);
  });

  test('createVaultKeyMaterial produces different ciphertext per call', async () => {
    const first = await createVaultKeyMaterial('same-password');
    const second = await createVaultKeyMaterial('same-password');

    expect(first.encryptedDek).not.toBe(second.encryptedDek);
    expect(first.dekSalt).not.toBe(second.dekSalt);
  });
});
