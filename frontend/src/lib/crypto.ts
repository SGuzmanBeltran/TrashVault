import { argon2id } from 'hash-wasm';

const ARGON2_PARAMS = {
  memory: 65536,
  iterations: 3,
  parallelism: 4,
};

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const AES_KEY_LENGTH = 256;

export async function deriveKek(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const hash = await argon2id({
    password,
    salt: salt as Uint8Array<ArrayBuffer>,
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

export async function generateDek(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptDek(
  dek: CryptoKey,
  kek: CryptoKey,
): Promise<{ encryptedDek: Uint8Array; iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const rawDek = await crypto.subtle.exportKey('raw', dek);
  const encryptedDek = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, rawDek),
  );
  return { encryptedDek, iv };
}

export async function decryptDek(
  encryptedDek: Uint8Array,
  iv: Uint8Array,
  kek: CryptoKey,
): Promise<CryptoKey> {
  const rawDek = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as Uint8Array<ArrayBuffer> },
    kek,
    encryptedDek as Uint8Array<ArrayBuffer>,
  );
  return crypto.subtle.importKey(
    'raw',
    rawDek,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptFile(
  plaintext: ArrayBuffer,
  dek: CryptoKey,
): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    dek,
    plaintext,
  );

  const ctArray = new Uint8Array(ciphertext);
  const result = new Uint8Array(iv.length + ctArray.length);
  result.set(iv, 0);
  result.set(ctArray, iv.length);
  return result.buffer as ArrayBuffer;
}

export async function decryptFile(
  ciphertext: ArrayBuffer,
  dek: CryptoKey,
): Promise<ArrayBuffer> {
  const data = new Uint8Array(ciphertext);
  const iv = data.slice(0, IV_LENGTH);
  const encrypted = data.slice(IV_LENGTH);

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    dek,
    encrypted as Uint8Array<ArrayBuffer>,
  );
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
