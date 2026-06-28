import { argon2id } from 'hash-wasm';

const ARGON2_PARAMS = {
  memory: 65536,
  iterations: 3,
  parallelism: 4,
};

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const AES_KEY_LENGTH = 256;

export const ARGON2_PARAMS_JSON = JSON.stringify({
  memory: ARGON2_PARAMS.memory,
  iterations: ARGON2_PARAMS.iterations,
  parallelism: ARGON2_PARAMS.parallelism,
});

async function deriveKek(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const hash = await argon2id({
    password,
    salt,
    parallelism: ARGON2_PARAMS.parallelism,
    memorySize: ARGON2_PARAMS.memory,
    iterations: ARGON2_PARAMS.iterations,
    hashLength: 32,
    outputType: 'binary',
  });

  return crypto.subtle.importKey(
    'raw',
    hash.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

export interface DemoVaultKeyMaterial {
  encryptedDek: string;
  dekIv: string;
  dekSalt: string;
  kdfAlgorithm: string;
  kdfParams: string;
}

export async function createVaultKeyMaterial(password: string): Promise<DemoVaultKeyMaterial> {
  const dek = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt'],
  );

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const kek = await deriveKek(password, salt);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const rawDek = await crypto.subtle.exportKey('raw', dek);
  const encryptedDek = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, rawDek),
  );

  return {
    encryptedDek: bytesToBase64(encryptedDek),
    dekIv: bytesToBase64(iv),
    dekSalt: bytesToBase64(salt),
    kdfAlgorithm: 'argon2id',
    kdfParams: ARGON2_PARAMS_JSON,
  };
}
