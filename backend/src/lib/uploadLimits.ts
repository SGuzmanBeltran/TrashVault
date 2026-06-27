import { ServiceError } from '../errors';

export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// AES-GCM ciphertext is plaintext + 16-byte tag; client prepends a 12-byte IV.
const ENCRYPTION_OVERHEAD_BYTES = 12 + 16;
export const MAX_UPLOAD_BYTES = MAX_FILE_SIZE_BYTES + ENCRYPTION_OVERHEAD_BYTES;

export function assertUploadSizeWithinLimit(sizeBytes: number): void {
  if (sizeBytes > MAX_UPLOAD_BYTES) {
    throw new ServiceError(400, `File exceeds the ${MAX_FILE_SIZE_MB}MB size limit`);
  }
}
