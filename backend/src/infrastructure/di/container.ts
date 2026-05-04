import { MinioStorageAdapter } from '../../adapters/storage/MinioStorage.adapter';
import { DrizzleFileRepositoryAdapter } from '../../adapters/repository/DrizzleFileRepository.adapter';
import { DrizzleFolderRepositoryAdapter } from '../../adapters/repository/DrizzleFolderRepository.adapter';
import { StoragePort, StorageConfig } from '../../ports/storage/Storage.port';
import { FileRepositoryPort } from '../../ports/repository/FileRepository.port';
import { FolderRepositoryPort } from '../../ports/repository/FolderRepository.port';
import { FileService } from '../../services/FileService.service';
import { FolderService } from '../../services/FolderService.service';

let storageInstance: StoragePort | null = null;
let fileRepositoryInstance: FileRepositoryPort | null = null;
let folderRepositoryInstance: FolderRepositoryPort | null = null;

export function registerStorage(config: StorageConfig): void {
  storageInstance = new MinioStorageAdapter(config);
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

export function createFileService(): FileService {
  return new FileService(getFileRepository(), getStorage());
}

export function createFolderService(): FolderService {
  return new FolderService(getFolderRepository());
}