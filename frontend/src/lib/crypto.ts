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

const DEVICE_KEY_COOKIE = 'tv-device-key';
const DEVICE_KEY_EXPIRY = 365;

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Strict`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

export async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  const existing = getCookie(DEVICE_KEY_COOKIE);
  if (existing) {
    const raw = base64ToBytes(existing);
    return crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, [
      'encrypt',
      'decrypt',
    ]);
  }

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: AES_KEY_LENGTH }, true, [
    'encrypt',
    'decrypt',
  ]);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  setCookie(DEVICE_KEY_COOKIE, bytesToBase64(raw), DEVICE_KEY_EXPIRY);
  return key;
}

export async function encryptForCache(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded));
  const result = new Uint8Array(iv.length + ciphertext.length);
  result.set(iv, 0);
  result.set(ciphertext, iv.length);
  return bytesToBase64(result);
}

export async function decryptFromCache(encrypted: string, key: CryptoKey): Promise<string> {
  const data = base64ToBytes(encrypted);
  const iv = data.slice(0, IV_LENGTH);
  const ciphertext = data.slice(IV_LENGTH);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext as Uint8Array<ArrayBuffer>,
  );
  return new TextDecoder().decode(plaintext);
}
