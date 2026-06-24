import { StorageConfig, StoragePort } from '../../ports/storage/Storage.port';

import { DrizzleFileRepositoryAdapter } from '../../adapters/repository/DrizzleFileRepository.adapter';
import { DrizzleFolderRepositoryAdapter } from '../../adapters/repository/DrizzleFolderRepository.adapter';
import { DrizzleEncryptionKeyRepositoryAdapter } from '../../adapters/repository/DrizzleEncryptionKeyRepository.adapter';
import { EncryptionKeyRepositoryPort } from '../../ports/repository/EncryptionKeyRepository.port';
import { EncryptionKeyService } from '../../services/EncryptionKeyService.service';
import { FileRepositoryPort } from '../../ports/repository/FileRepository.port';
import { FileService } from '../../services/FileService.service';
import { FolderRepositoryPort } from '../../ports/repository/FolderRepository.port';
import { FolderService } from '../../services/FolderService.service';
import { S3StorageAdapter } from '../../adapters/storage/S3Storage.adapter';
import { StatsService } from '../../services/StatsService.service';
import { ThumbnailService } from '../../services/ThumbnailService.service';
import { TrashService } from '../../services/TrashService.service';
import { SearchService } from '../../services/SearchService.service';

let storageInstance: StoragePort | null = null;
let fileRepositoryInstance: FileRepositoryPort | null = null;
let folderRepositoryInstance: FolderRepositoryPort | null = null;
let encryptionKeyRepositoryInstance: EncryptionKeyRepositoryPort | null = null;

export function registerStorage(config: StorageConfig): void {
    storageInstance = new S3StorageAdapter(config);
}

export function getStorage(): StoragePort {
  if (!storageInstance) {
    throw new Error('Storage not registered. Call registerStorage first.');
  }
  return storageInstance;
}

export function registerFileRepository(): void {
  fileRepositoryInstance = new DrizzleFileRepositoryAdapter();
}

export function getFileRepository(): FileRepositoryPort {
  if (!fileRepositoryInstance) {
    throw new Error('FileRepository not registered. Call registerFileRepository first.');
  }
  return fileRepositoryInstance;
}

export function registerFolderRepository(): void {
  folderRepositoryInstance = new DrizzleFolderRepositoryAdapter();
}

export function getFolderRepository(): FolderRepositoryPort {
  if (!folderRepositoryInstance) {
    throw new Error('FolderRepository not registered. Call registerFolderRepository first.');
  }
  return folderRepositoryInstance;
}

export function registerEncryptionKeyRepository(): void {
  encryptionKeyRepositoryInstance = new DrizzleEncryptionKeyRepositoryAdapter();
}

export function getEncryptionKeyRepository(): EncryptionKeyRepositoryPort {
  if (!encryptionKeyRepositoryInstance) {
    throw new Error('EncryptionKeyRepository not registered. Call registerEncryptionKeyRepository first.');
  }
  return encryptionKeyRepositoryInstance;
}

export function createThumbnailService(): ThumbnailService {
  return new ThumbnailService(getStorage());
}

export function createFileService(): FileService {
  return new FileService(getFileRepository(), getFolderRepository(), getStorage(), createThumbnailService());
}

export function createFolderService(): FolderService {
  return new FolderService(getFolderRepository(), getFileRepository(), getStorage());
}

export function createStatsService(): StatsService {
  return new StatsService();
}

export function createTrashService(): TrashService {
  return new TrashService(getFileRepository(), getFolderRepository(), getStorage());
}

export function createEncryptionKeyService(): EncryptionKeyService {
  return new EncryptionKeyService(getEncryptionKeyRepository());
}

export function createSearchService(): SearchService {
  return new SearchService(getFileRepository(), getFolderRepository());
}