import { FileEntity, FileRepositoryPort } from '../ports/repository/FileRepository.port';
import { FolderRepositoryPort } from '../ports/repository/FolderRepository.port';
import { wrapRepositoryError, wrapStorageError, NotFoundError, ServiceError, StorageError, ConflictError } from '../errors';

import { StoragePort } from '../ports/storage/Storage.port';
import { ThumbnailService } from './ThumbnailService.service';
import { sanitizeItemName } from '../lib/itemName';
import { assertGlobalStorageAvailable } from '../lib/globalStorageConfig';

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
  thumbnail: ArrayBuffer | null;
}

export class FileService {
  constructor(
    private fileRepository: FileRepositoryPort,
    private folderRepository: FolderRepositoryPort,
    private storage: StoragePort,
    private thumbnailService: ThumbnailService,
  ) {}

  async createFile(params: CreateFileParams): Promise<FileEntity> {
    await assertGlobalStorageAvailable(this.fileRepository, params.size);

    try {
      await this.storage.upload(params.buffer, params.key, params.mimeType);
    } catch (error) {
      throw wrapStorageError(error);
    }

    let thumbnailKey: string | null = null;
    if (params.thumbnail) {
      try {
        thumbnailKey = this.thumbnailService.getThumbnailKey(params.key);
        await this.storage.upload(params.thumbnail, thumbnailKey, 'image/jpeg');
      } catch {
        thumbnailKey = null;
      }
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
        trashedAt: null,
      });
    } catch (error) {
      await this.storage.delete(params.key).catch(() => {});
      if (thumbnailKey) {
        await this.storage.delete(thumbnailKey).catch(() => {});
      }
      throw wrapRepositoryError(error);
    }
  }

  async replaceFileContent(
    id: string,
    userId: string,
    params: { buffer: ArrayBuffer; mimeType: string; size: number; thumbnail: ArrayBuffer | null },
  ): Promise<FileEntity> {
    try {
      const file = await this.fileRepository.findById(id, userId);
      if (!file || file.trashedAt) {
        throw new NotFoundError('File not found');
      }

      const additionalBytes = Math.max(0, params.size - file.size);
      await assertGlobalStorageAvailable(this.fileRepository, additionalBytes);

      try {
        await this.storage.upload(params.buffer, file.key, params.mimeType);
      } catch (error) {
        throw wrapStorageError(error);
      }

      let thumbnailKey = file.thumbnailKey;
      if (params.thumbnail) {
        try {
          thumbnailKey = this.thumbnailService.getThumbnailKey(file.key);
          await this.storage.upload(params.thumbnail, thumbnailKey, 'image/jpeg');
        } catch {
          thumbnailKey = file.thumbnailKey;
        }
      }

      const updated = await this.fileRepository.updateContent(id, userId, {
        size: params.size,
        mimeType: params.mimeType,
        thumbnailKey,
      });
      if (!updated) {
        throw new NotFoundError('File not found');
      }

      return updated;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
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
      await this.fileRepository.moveToTrash(id, userId);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  async moveFile(id: string, userId: string, folderId: string | null): Promise<FileEntity> {
    try {
      const file = await this.fileRepository.findById(id, userId);
      if (!file || file.trashedAt) {
        throw new NotFoundError('File not found');
      }

      if (folderId) {
        const folder = await this.folderRepository.findById(folderId, userId);
        if (!folder || folder.trashedAt) {
          throw new NotFoundError('Destination folder not found');
        }
      }

      const updated = await this.fileRepository.updateFolderId(id, userId, folderId);
      if (!updated) {
        throw new NotFoundError('File not found');
      }

      return updated;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw wrapRepositoryError(error);
    }
  }

  async renameFile(id: string, userId: string, name: string): Promise<FileEntity> {
    try {
      const sanitized = sanitizeItemName(name);
      const file = await this.fileRepository.findById(id, userId);
      if (!file || file.trashedAt) {
        throw new NotFoundError('File not found');
      }

      if (sanitized === file.name) {
        return file;
      }

      const siblings = await this.fileRepository.findByUserId(userId, file.folderId);
      if (siblings.some((item) => item.id !== id && item.name === sanitized)) {
        throw new ConflictError('A file with this name already exists in this folder');
      }

      const updated = await this.fileRepository.updateName(id, userId, sanitized);
      if (!updated) {
        throw new NotFoundError('File not found');
      }

      return updated;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw wrapRepositoryError(error);
    }
  }

  async permanentDeleteFile(id: string, userId: string): Promise<void> {
    try {
      const file = await this.fileRepository.findById(id, userId);
      if (!file) return;

      await this.storage.delete(file.key).catch(() => {});
      if (file.thumbnailKey) {
        await this.storage.delete(file.thumbnailKey).catch(() => {});
      }
      await this.fileRepository.permanentDelete(id, userId);
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

  async getFileBytes(id: string, userId: string): Promise<{ buffer: ArrayBuffer; mimeType: string } | null> {
    try {
      const file = await this.fileRepository.findById(id, userId);
      if (!file) return null;
      const buffer = await this.storage.download(file.key);
      return { buffer, mimeType: file.mimeType };
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw wrapRepositoryError(error);
    }
  }

  async getThumbnailBytes(id: string, userId: string): Promise<ArrayBuffer | null> {
    try {
      const file = await this.fileRepository.findById(id, userId);
      if (!file || !file.thumbnailKey) return null;
      return this.storage.download(file.thumbnailKey);
    } catch (error) {
      if (error instanceof StorageError) throw error;
      throw wrapRepositoryError(error);
    }
  }
}