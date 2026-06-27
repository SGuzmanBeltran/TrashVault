import { ServiceError } from '../errors';
import type { FileRepositoryPort } from '../ports/repository/FileRepository.port';

const DEFAULT_GLOBAL_STORAGE_MAX_BYTES = 1 * 1024 * 1024 * 1024;

export function getGlobalStorageMaxBytes(): number | null {
  const raw = process.env.GLOBAL_STORAGE_MAX_BYTES;
  if (raw === '0') return null;

  if (!raw) return DEFAULT_GLOBAL_STORAGE_MAX_BYTES;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_GLOBAL_STORAGE_MAX_BYTES;
}

function formatLimitLabel(maxBytes: number): string {
  if (maxBytes % (1024 * 1024 * 1024) === 0) {
    return `${maxBytes / (1024 * 1024 * 1024)} GB`;
  }
  return `${Math.round(maxBytes / (1024 * 1024))} MB`;
}

export async function assertGlobalStorageAvailable(
  fileRepository: FileRepositoryPort,
  additionalBytes: number,
): Promise<void> {
  const maxBytes = getGlobalStorageMaxBytes();
  if (maxBytes === null || additionalBytes <= 0) return;

  const usedBytes = await fileRepository.getTotalStorageBytes();
  if (usedBytes + additionalBytes > maxBytes) {
    throw new ServiceError(
      507,
      `Platform storage limit reached (${formatLimitLabel(maxBytes)}). Delete files to free space.`,
    );
  }
}
