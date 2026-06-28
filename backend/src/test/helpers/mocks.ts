import type { FileEntity } from '../../ports/repository/FileRepository.port';
import type { FolderEntity } from '../../ports/repository/FolderRepository.port';
import type { FileRepositoryPort } from '../../ports/repository/FileRepository.port';
import type { FolderRepositoryPort } from '../../ports/repository/FolderRepository.port';
import type { StoragePort } from '../../ports/storage/Storage.port';
import type { EncryptionKeyRepositoryPort } from '../../ports/repository/EncryptionKeyRepository.port';
import type { StatsRepositoryPort } from '../../ports/repository/StatsRepository.port';
import type { BillingPort } from '../../ports/billing/Billing.port';

export function makeFile(overrides: Partial<FileEntity> = {}): FileEntity {
  return {
    id: 'file-1',
    userId: 'user-1',
    name: 'doc.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    bucket: 'bucket',
    key: 'files/user-1/doc.pdf',
    folderId: null,
    thumbnailKey: null,
    createdAt: new Date('2025-01-01'),
    trashedAt: null,
    ...overrides,
  };
}

export function makeFolder(overrides: Partial<FolderEntity> = {}): FolderEntity {
  return {
    id: 'folder-1',
    userId: 'user-1',
    name: 'Projects',
    parentId: null,
    createdAt: new Date('2025-01-01'),
    trashedAt: null,
    ...overrides,
  };
}

export function createMockFileRepository(
  overrides: Partial<FileRepositoryPort> = {},
): FileRepositoryPort {
  return {
    create: async (data) => ({ ...data }),
    findById: async () => null,
    findByUserId: async () => [],
    delete: async () => {},
    updateFolderId: async () => null,
    updateName: async () => null,
    updateContent: async () => null,
    moveToTrash: async () => {},
    restoreFromTrash: async () => {},
    findTrashedByUserId: async () => [],
    findActiveByFolderIds: async () => [],
    searchByName: async () => [],
    permanentDelete: async () => {},
    permanentDeleteMany: async () => {},
    emptyTrash: async () => {},
    findAll: async () => [],
    deleteMany: async () => {},
    getTotalStorageBytes: async () => 0,
    ...overrides,
  };
}

export function createMockFolderRepository(
  overrides: Partial<FolderRepositoryPort> = {},
): FolderRepositoryPort {
  return {
    create: async (data) => ({ ...data }),
    findById: async () => null,
    findByUserId: async () => [],
    delete: async () => {},
    updateParentId: async () => null,
    updateName: async () => null,
    moveToTrash: async () => {},
    restoreFromTrash: async () => {},
    findTrashedByUserId: async () => [],
    findAllActiveByUserId: async () => [],
    searchByName: async () => [],
    permanentDelete: async () => {},
    permanentDeleteMany: async () => {},
    restoreManyFromTrash: async () => {},
    emptyTrash: async () => {},
    findAll: async () => [],
    deleteMany: async () => {},
    ...overrides,
  };
}

export function createMockStorage(overrides: Partial<StoragePort> = {}): StoragePort {
  return {
    upload: async () => {},
    download: async () => new ArrayBuffer(0),
    delete: async () => {},
    getSignedUrl: async (key) => `https://signed.example/${key}`,
    ...overrides,
  };
}

export function createMockEncryptionKeyRepository(
  overrides: Partial<EncryptionKeyRepositoryPort> = {},
): EncryptionKeyRepositoryPort {
  return {
    create: async (data) => ({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findByUserId: async () => null,
    update: async (userId, data) => ({
      userId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    ...overrides,
  };
}

export function createMockStatsRepository(
  overrides: Partial<StatsRepositoryPort> = {},
): StatsRepositoryPort {
  return {
    countFilesByUserId: async () => 0,
    countFoldersByUserId: async () => 0,
    sumFileBytesByUserId: async () => 0,
    findRecentFilesByUserId: async () => [],
    getUserStorageTier: async () => 'free',
    updateUserStorageTier: async () => {},
    ...overrides,
  };
}

export function createMockBillingPort(overrides: Partial<BillingPort> = {}): BillingPort {
  return {
    createCheckoutSession: async () => ({ checkoutUrl: 'https://checkout.test/session' }),
    parseWebhookEvent: async () => null,
    ...overrides,
  };
}
