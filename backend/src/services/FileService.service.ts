import { FileEntity, FileRepositoryPort } from '../ports/repository/FileRepository.port';

import { StoragePort } from '../ports/storage/Storage.port';
import { ThumbnailService } from './ThumbnailService.service';

export interface CreateFileParams {
  id: string;
  userId: string;
  name: string;
  mimeType: string;
  size: number;
  bucket: string;
  key: string;
  folderId: string | null;
  buffer: ArrayBuffer;
}

export class FileService {
  constructor(
    private fileRepository: FileRepositoryPort,
    private storage: StoragePort,
    private thumbnailService: ThumbnailService,
  ) {}

  async createFile(params: CreateFileParams): Promise<FileEntity> {
    await this.storage.upload(params.buffer, params.key, params.mimeType);

    const thumbnailKey = await this.thumbnailService.generateAndUpload(
      params.buffer,
      params.mimeType,
      params.key,
    );

    try {
      return await this.fileRepository.create({
        id: params.id,
        userId: params.userId,
        name: params.name,
        mimeType: params.mimeType,
        size: params.size,
        bucket: params.bucket,
        key: params.key,
        folderId: params.folderId,
        thumbnailKey,
        createdAt: new Date(),
      });
    } catch (error) {
      await this.storage.delete(params.key);
      if (thumbnailKey) {
        await this.storage.delete(thumbnailKey).catch(() => {});
      }
      throw error;
    }
  }

  async getThumbnailUrl(
    id: string,
    userId: string,
    expiresIn: number = 3600,
  ): Promise<string | null> {
    const file = await this.fileRepository.findById(id, userId);
    if (!file || !file.thumbnailKey) return null;

    return this.storage.getSignedUrl(file.thumbnailKey, expiresIn);
  }

  async getFile(id: string, userId: string): Promise<FileEntity | null> {
    return this.fileRepository.findById(id, userId);
  }

  async getFilesByUser(userId: string, folderId?: string | null): Promise<FileEntity[]> {
    return this.fileRepository.findByUserId(userId, folderId);
  }

  async deleteFile(id: string, userId: string): Promise<void> {
    const file = await this.fileRepository.findById(id, userId);
    if (!file) {
      return;
    }

    await this.storage.delete(file.key);

    await this.fileRepository.delete(id, userId);
  }

  async getDownloadUrl(id: string, userId: string, expiresIn: number = 3600): Promise<string | null> {
    const file = await this.fileRepository.findById(id, userId);
    if (!file) return null;

    return this.storage.getSignedUrl(file.key, expiresIn);
  }
}