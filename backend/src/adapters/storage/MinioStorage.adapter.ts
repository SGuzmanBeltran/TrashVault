import { StorageConfig, StoragePort } from '../../ports/storage/Storage.port';

import { Client } from 'minio';

export class MinioStorageAdapter implements StoragePort {
  private client: Client;
  private bucket: string;

  constructor(config: StorageConfig) {
    this.client = new Client({
      endPoint: config.endpoint.split(':')[0],
      port: parseInt(config.endpoint.split(':')[1] || '9000'),
      useSSL: false,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
    this.bucket = config.bucket;
  }

  async upload(buffer: ArrayBuffer, key: string, mimeType: string): Promise<void> {
    const size = buffer.byteLength;
    const metadata = { 'Content-Type': mimeType };
    await this.client.putObject(this.bucket, key, Buffer.from(buffer), size, metadata);
  }

  async download(key: string): Promise<ArrayBuffer> {
    const stream = await this.client.getObject(this.bucket, key);
    const chunks: Uint8Array[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result.buffer;
  }

  async delete(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expiresIn);
  }
}