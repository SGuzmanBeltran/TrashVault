export interface StoragePort {
  upload(buffer: ArrayBuffer, key: string, mimeType: string): Promise<void>;
  download(key: string): Promise<ArrayBuffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn: number): Promise<string>;
}

export interface StorageConfig {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}