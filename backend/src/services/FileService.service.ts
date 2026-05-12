import { FileEntity, FileRepositoryPort } from '../ports/repository/FileRepository.port';
import { StorageError, wrapRepositoryError, wrapStorageError } from '../errors';

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
    try {
      await this.storage.upload(params.buffer, params.key, params.mimeType);
    } catch (error) {
      throw wrapStorageError(error);
    }

    let thumbnailKey: string | null = null;
    try {
      thumbnailKey = await this.thumbnailService.generateAndUpload(
        params.buffer,
        params.mimeType,
        params.key,
      );
    } catch {
      thumbnailKey = null;
    }

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
      await this.storage.delete(params.key).catch(() => {});
      if (thumbnailKey) {
        await this.storage.delete(thumbnailKey).catch(() => {});
      }
      throw wrapRepositoryError(error);
    }
  }

  async getThumbnailUrl(id: string, userId: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const file = await this.fileRepository.findById(id, userId);
      if (!file || !file.thumbnailKey) return null;
      return this.storage.getSignedUrl(file.thumbnailKey, expiresIn);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  async getFile(id: string, userId: string): Promise<FileEntity | null> {
    try {
      return await this.fileRepository.findById(id, userId);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  async getFilesByUser(userId: string, folderId?: string | null): Promise<FileEntity[]> {
    try {
      return await this.fileRepository.findByUserId(userId, folderId);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  async deleteFile(id: string, userId: string): Promise<void> {
    try {
      const file = await this.fileRepository.findById(id, userId);
      if (!file) return;

      await this.storage.delete(file.key);
      if (file.thumbnailKey) {
        await this.storage.delete(file.thumbnailKey).catch(() => {});
      }
      await this.fileRepository.delete(id, userId);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw wrapRepositoryError(error);
    }
  }

  async getDownloadUrl(id: string, userId: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const file = await this.fileRepository.findById(id, userId);
      if (!file) return null;
      return this.storage.getSignedUrl(file.key, expiresIn);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }
}