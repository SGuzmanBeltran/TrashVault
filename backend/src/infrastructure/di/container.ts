import { StorageConfig, StoragePort } from '../../ports/storage/Storage.port';

import { MinioStorageAdapter } from '../../adapters/storage/MinioStorage.adapter';

let storageInstance: StoragePort | null = null;

export function registerStorage(config: StorageConfig): void {
  storageInstance = new MinioStorageAdapter(config);
}

export function getStorage(): StoragePort {
  if (!storageInstance) {
    throw new Error('Storage not registered. Call registerStorage first.');
  }
  return storageInstance;
}

export function createStorage(config: StorageConfig): StoragePort {
  return new MinioStorageAdapter(config);
}