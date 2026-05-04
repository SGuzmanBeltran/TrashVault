import { MinioStorageAdapter } from '../../adapters/storage/MinioStorage.adapter.js';
import { StoragePort, StorageConfig } from '../../ports/storage/Storage.port.js';

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