import type { StoragePort } from '../../ports/storage/Storage.port';

export class InMemoryStorageAdapter implements StoragePort {
  private readonly store = new Map<string, { buffer: ArrayBuffer; mimeType: string }>();

  async upload(buffer: ArrayBuffer, key: string, mimeType: string): Promise<void> {
    this.store.set(key, { buffer, mimeType });
  }

  async download(key: string): Promise<ArrayBuffer> {
    const item = this.store.get(key);
    if (!item) {
      throw new Error(`Storage key not found: ${key}`);
    }
    return item.buffer;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    return `https://inmemory.test/${key}?expires=${expiresIn}`;
  }
}
