# Zero-Trust Encryption — Design Spec

## Overview

Client-side encryption for TrashVault. Files are encrypted in the browser before upload; the server stores only ciphertext. The server never sees plaintext file contents or encryption keys.

## Cryptographic Choices

| Primitive | Algorithm | Notes |
|---|---|---|
| Key derivation | **Argon2id** via `hash-wasm` | GPU-resistant. Web Crypto has no Argon2, so WASM is needed. |
| File encryption | **AES-256-GCM** (Web Crypto API) | Authenticated encryption. Native, fast, hardware-accelerated. |
| DEK encryption | **AES-256-GCM** (Web Crypto API) | Same algorithm, separate key (KEK). |
| IV size | 96 bits (12 bytes) | Standard for AES-GCM. |
| Salt size | 128 bits (16 bytes) | Random per-user. |

## Key Architecture

```
User Password
     │
     ├────────────────────► bcrypt (server, Better Auth) → session
     │
     ▼
 Argon2id(password, salt)   ← client-side
     │
     ▼
   KEK (256-bit, CryptoKey)
     │
     ▼
 AES-256-GCM(encryptedDek, kek) → DEK (256-bit, CryptoKey)
     │
     ▼
 AES-256-GCM(fileBytes, dek, randomIv) → encrypted file
```

The server never sees KEK or DEK plaintext. It stores:

- bcrypt hash of password (Better Auth `account` table)
- Encrypted DEK + salt + KDF params (new `user_encryption_keys` table)

Same password for auth and crypto, but through completely different paths (bcrypt vs Argon2id). If the user forgets their password, data is unrecoverable — this is the intended zero-trust behavior.

## Encrypted File Format (in R2)

```
┌──────────────┬─────────────────────┬──────────────┐
│ IV (12 bytes)│ Ciphertext (N bytes)│ Tag (16 bytes)│
└──────────────┴─────────────────────┴──────────────┘
```

IV is prepended, GCM tag is appended by Web Crypto automatically. Total overhead: 28 bytes per file.

## DB Schema Changes

### New table: `user_encryption_keys`

```ts
// backend/src/db/schema.ts
export const userEncryptionKeys = pgTable('user_encryption_keys', {
  userId: text('user_id').primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  encryptedDek: text('encrypted_dek').notNull(),     // Base64
  dekIv: text('dek_iv').notNull(),                    // Base64, IV for DEK encryption
  dekSalt: text('dek_salt').notNull(),                // Base64, salt for Argon2id
  kdfAlgorithm: text('kdf_algorithm').notNull().default('argon2id'),
  kdfParams: text('kdf_params').notNull(),            // JSON: { memory: 65536, iterations: 3, parallelism: 4 }
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### Modify `files` table

Add column:

```ts
isEncrypted: boolean('is_encrypted').default(false).notNull(),
```

No per-file IV column needed — IV is prepended to the ciphertext in R2.

## New Backend Endpoints

```
POST   /api/user/encryption-key    # Create (on registration)
GET    /api/user/encryption-key    # Fetch (on login/unlock)
PUT    /api/user/encryption-key    # Update (on password change)
```

Simple CRUD — the backend just stores/retrieves the encrypted DEK blob. No crypto logic on the server.

## New Backend Files

| File | Purpose |
|---|---|
| `src/db/schema.ts` | Add `userEncryptionKeys` table |
| `src/ports/repository/EncryptionKeyRepository.port.ts` | Interface for key CRUD |
| `src/adapters/repository/DrizzleEncryptionKeyRepository.adapter.ts` | Drizzle implementation |
| `src/services/EncryptionKeyService.service.ts` | Business logic (create, get, update) |
| `src/infrastructure/http/EncryptionKeyRoutes.infra.ts` | Elysia route plugin |

## New Frontend Files

| File | Purpose |
|---|---|
| `src/lib/crypto.ts` | Core crypto: Argon2id derivation, AES-GCM encrypt/decrypt, key generation |
| `src/stores/vault.ts` | Pinia store: holds DEK in memory, unlock/lock/init |
| `src/adapters/HttpEncryptionAdapter.ts` | API calls for encryption key CRUD |
| `src/ports/index.ts` | Add `EncryptionPort` interface |

## Frontend: `lib/crypto.ts` API

```ts
// Argon2id parameters (tunable)
const ARGON2_PARAMS = { memory: 65536, iterations: 3, parallelism: 4 }

// Derive KEK from password + salt
async function deriveKek(password: string, salt: Uint8Array): Promise<CryptoKey>

// Generate random 256-bit DEK
async function generateDek(): Promise<CryptoKey>

// Encrypt DEK with KEK (returns { encryptedDek, iv })
async function encryptDek(dek: CryptoKey, kek: CryptoKey): Promise<{ encryptedDek: Uint8Array; iv: Uint8Array }>

// Decrypt DEK with KEK
async function decryptDek(encryptedDek: Uint8Array, iv: Uint8Array, kek: CryptoKey): Promise<CryptoKey>

// Encrypt file bytes with DEK (returns IV+ciphertext+tag)
async function encryptFile(plaintext: ArrayBuffer, dek: CryptoKey): Promise<ArrayBuffer>

// Decrypt file bytes with DEK (expects IV+ciphertext+tag)
async function decryptFile(ciphertext: ArrayBuffer, dek: CryptoKey): Promise<ArrayBuffer>

// Helpers
function generateSalt(): Uint8Array        // 16 random bytes
function bytesToBase64(bytes: Uint8Array): string
function base64ToBytes(b64: string): Uint8Array
```

Uses `hash-wasm` for Argon2id (WASM) and `SubtleCrypto` for AES-256-GCM.

## Frontend: `stores/vault.ts`

```ts
const dek = ref<CryptoKey | null>(null)
const isUnlocked = computed(() => dek.value !== null)

async function unlock(password: string)
  // 1. GET /api/user/encryption-key → { encryptedDek, dekIv, dekSalt, kdfParams }
  // 2. deriveKek(password, salt) → kek
  // 3. decryptDek(encryptedDek, iv, kek) → dek
  // 4. Store dek in memory
  // 5. Cache password in sessionStorage (for page refresh auto-unlock)

async function initOnRegistration(password: string)
  // 1. generateDek() → dek
  // 2. generateSalt() → salt
  // 3. deriveKek(password, salt) → kek
  // 4. encryptDek(dek, kek) → { encryptedDek, iv }
  // 5. POST /api/user/encryption-key (store encrypted DEK + salt + params)
  // 6. Store dek in memory, cache password in sessionStorage

async function tryAutoUnlock()
  // Read password from sessionStorage
  // If present, call unlock(password)
  // If absent, vault stays locked — UI shows unlock prompt

function lock()
  // Clear dek from memory, clear sessionStorage
```

## Frontend: Auth Flow Changes

### Login (`stores/auth.ts`)

```ts
async function login(email, password) {
  await authService.login(email, password)      // existing
  user.value = await authService.getCurrentUser() // existing
  await vaultStore.unlock(password)               // NEW
}
```

### App mount (checkSession)

```ts
async function checkSession() {
  user.value = await authService.getCurrentUser()  // existing
  if (user.value) {
    await vaultStore.tryAutoUnlock()                // NEW
  }
}
```

### Registration (new flow)

```ts
async function register(email, password, name) {
  await authClient.signUp.email({ email, password, name })
  user.value = await authService.getCurrentUser()
  await vaultStore.initOnRegistration(password)    // NEW: generate + store DEK
}
```

### Logout

```ts
async function logout() {
  vaultStore.lock()        // NEW: clear DEK from memory
  await authService.logout()
  user.value = null
}
```

## Frontend: Upload Flow Changes

`HttpFileAdapter.uploadFileWithProgress()`:

```ts
async uploadFileWithProgress(file, folderId, callbacks) {
  const dek = vaultStore.dek
  if (!dek) throw new Error('Vault is locked')

  // 1. Read file as ArrayBuffer
  const plaintext = await file.arrayBuffer()
  // 2. Encrypt
  const ciphertext = await encryptFile(plaintext, dek)
  // 3. Create encrypted Blob (preserve original name + mimeType)
  const encryptedBlob = new Blob([ciphertext], { type: file.type })
  const encryptedFile = new File([encryptedBlob], file.name, { type: file.type })
  // 4. Upload encrypted file via existing XHR flow
  return uploadWithProgress(encryptedFile, folderId, callbacks)
}
```

Backend upload route: pass `isEncrypted: true` as a form field, read it in the route handler.

## Frontend: Download Flow Changes

Currently `getDownloadUrl()` returns a signed URL opened in a new tab. New approach:

```ts
async downloadFile(id: string): Promise<{ blobUrl: string; filename: string; mimeType: string }> {
  const dek = vaultStore.dek
  const meta = await apiFetch<BackendFileItem>(`/files/${id}`)
  const { url } = await apiFetch<{ url: string }>(`/files/${id}/download`)

  if (meta.isEncrypted && dek) {
    const resp = await fetch(url)
    const ciphertext = await resp.arrayBuffer()
    const plaintext = await decryptFile(ciphertext, dek)
    const blob = new Blob([plaintext], { type: meta.mimeType })
    return { blobUrl: URL.createObjectURL(blob), filename: meta.name, mimeType: meta.mimeType }
  } else {
    return { blobUrl: url, filename: meta.name, mimeType: meta.mimeType }
  }
}
```

## Password Change Flow

1. User enters old + new password
2. Frontend derives old KEK, fetches encrypted DEK, decrypts → DEK in memory
3. Frontend calls Better Auth change-password endpoint
4. Frontend derives new KEK (new salt), re-encrypts DEK
5. Frontend PUTs updated encrypted DEK to backend
6. Update sessionStorage cache with new password

If step 3 succeeds but step 5 fails: DEK is still in memory for the current session. Show a warning but don't block.

## Known Limitations

| Data | Status | Reason |
|---|---|---|
| File names | Plaintext | Encrypted names break search, breadcrumbs, UI |
| Folder names | Plaintext | Same |
| File size | Plaintext | Needed for quota display |
| mimeType | Plaintext | Needed for UI icons, previews |
| File contents | **Encrypted** | Zero-trust goal |
| Thumbnails | **Skipped** for encrypted files | Server can't generate from ciphertext |
| Large files (>500MB) | May hit memory limits | Whole-file encryption in browser memory |

## Dependencies to Add

| Package | Where | Purpose |
|---|---|---|
| `hash-wasm` | `frontend/package.json` | Argon2id WASM implementation |

No new backend dependencies — the backend just stores/retrieves blobs.

## Migration Strategy

1. Add `isEncrypted` column to `files` table (default `false`)
2. Add `user_encryption_keys` table
3. Existing files remain unencrypted (`isEncrypted = false`)
4. New files uploaded after encryption is enabled get `isEncrypted = true`
5. Optional future task: bulk re-encrypt existing files

## Implementation Order

1. **Backend**: `user_encryption_keys` table + repository + service + routes
2. **Frontend**: `lib/crypto.ts` (all crypto primitives)
3. **Frontend**: `stores/vault.ts` + `HttpEncryptionAdapter.ts`
4. **Frontend**: Wire vault into auth flow (login, register, logout, session check)
5. **Frontend**: Modify upload flow (encrypt before upload)
6. **Frontend**: Modify download flow (fetch + decrypt)
7. **Frontend**: Add unlock prompt UI (for when sessionStorage is empty)
8. **Frontend**: Password change flow (re-encrypt DEK)

## Future Enhancements

- Client-side thumbnail generation (canvas API) for encrypted image previews
- Streaming encryption for large files (chunked AES-GCM)
- Folder/file name encryption (requires encrypted index or client-side search)
- Re-encrypt existing files in bulk
