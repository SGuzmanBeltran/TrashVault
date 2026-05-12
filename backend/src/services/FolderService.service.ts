import { FolderEntity, FolderRepositoryPort } from '../ports/repository/FolderRepository.port';

import { FileRepositoryPort } from '../ports/repository/FileRepository.port';
import { StoragePort } from '../ports/storage/Storage.port';
import { wrapRepositoryError } from '../errors';

export interface CreateFolderParams {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
}

export class FolderService {
  constructor(
    private folderRepository: FolderRepositoryPort,
    private fileRepository: FileRepositoryPort,
    private storage: StoragePort,
  ) {}

  async createFolder(params: CreateFolderParams): Promise<FolderEntity> {
    try {
      return await this.folderRepository.create({
        id: params.id,
        userId: params.userId,
        name: params.name,
        parentId: params.parentId,
        createdAt: new Date(),
        trashedAt: null,
      });
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  async getFolder(id: string, userId: string): Promise<FolderEntity | null> {
    try {
      return await this.folderRepository.findById(id, userId);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  async getFoldersByUser(userId: string, parentId?: string | null): Promise<FolderEntity[]> {
    try {
      return await this.folderRepository.findByUserId(userId, parentId);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  async deleteFolder(id: string, userId: string): Promise<void> {
    try {
      const folderIds = await this.collectFolderIds(id, userId);
      await this.deleteFilesInFolders(folderIds, userId);
      await this.deleteFoldersFromDb(folderIds, userId);
    } catch (error) {
      if (error instanceof Error && error.constructor.name === 'StorageError') throw error;
      throw wrapRepositoryError(error);
    }
  }

  private async collectFolderIds(rootId: string, userId: string): Promise<string[]> {
    const ids: string[] = [rootId];
    const queue: string[] = [rootId];

    while (queue.length > 0) {
      const parentId = queue.shift()!;
      const children = await this.folderRepository.findByUserId(userId, parentId);
      for (const child of children) {
        ids.push(child.id);
        queue.push(child.id);
      }
    }

    return ids;
  }

  private async deleteFilesInFolders(folderIds: string[], userId: string): Promise<void> {
    for (const folderId of folderIds) {
      const files = await this.fileRepository.findByUserId(userId, folderId);
      for (const file of files) {
        await this.storage.delete(file.key).catch(() => {});
        if (file.thumbnailKey) {
          await this.storage.delete(file.thumbnailKey).catch(() => {});
        }
        await this.fileRepository.delete(file.id, userId);
      }
    }
  }

  private async deleteFoldersFromDb(folderIds: string[], userId: string): Promise<void> {
    for (let i = folderIds.length - 1; i >= 0; i--) {
      await this.folderRepository.delete(folderIds[i], userId);
    }
  }
}