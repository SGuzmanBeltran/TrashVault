import { FolderEntity, FolderRepositoryPort } from '../ports/repository/FolderRepository.port';

import { FileRepositoryPort } from '../ports/repository/FileRepository.port';
import { StoragePort } from '../ports/storage/Storage.port';
import { wrapRepositoryError, NotFoundError, ServiceError } from '../errors';
import { zipSync } from 'fflate';

export interface CreateFolderParams {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
}

interface FolderZipEntry {
  zipPath: string;
  mimeType: string;
  key: string;
}

interface FolderZipManifest {
  version: 1;
  files: { path: string; mimeType: string }[];
}

export interface FolderZipDownload {
  buffer: Uint8Array;
  filename: string;
}

const MANIFEST_PATH = '__trashvault__/manifest.json';

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
      for (const folderId of folderIds) {
        await this.folderRepository.moveToTrash(folderId, userId);
      }
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  async moveFolder(id: string, userId: string, parentId: string | null): Promise<FolderEntity> {
    try {
      const folder = await this.folderRepository.findById(id, userId);
      if (!folder || folder.trashedAt) {
        throw new NotFoundError('Folder not found');
      }

      if (parentId === id) {
        throw new ServiceError(400, 'Cannot move folder into itself');
      }

      if (parentId) {
        const descendants = await this.collectFolderIds(id, userId);
        if (descendants.includes(parentId)) {
          throw new ServiceError(400, 'Cannot move folder into its subfolder');
        }

        const parent = await this.folderRepository.findById(parentId, userId);
        if (!parent || parent.trashedAt) {
          throw new NotFoundError('Destination folder not found');
        }
      }

      const updated = await this.folderRepository.updateParentId(id, userId, parentId);
      if (!updated) {
        throw new NotFoundError('Folder not found');
      }

      return updated;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw wrapRepositoryError(error);
    }
  }

  async buildFolderZipBuffer(folderId: string, userId: string): Promise<FolderZipDownload> {
    try {
      const folder = await this.folderRepository.findById(folderId, userId);
      if (!folder || folder.trashedAt) {
        throw new NotFoundError('Folder not found');
      }

      const entries = await this.collectFolderZipEntries(folderId, userId, folder.name);
      const manifest: FolderZipManifest = {
        version: 1,
        files: entries.map((entry) => ({
          path: entry.zipPath,
          mimeType: entry.mimeType,
        })),
      };

      const zipEntries: Record<string, Uint8Array> = {
        [MANIFEST_PATH]: new TextEncoder().encode(JSON.stringify(manifest)),
      };

      for (const entry of entries) {
        const buffer = await this.storage.download(entry.key);
        zipEntries[entry.zipPath] = new Uint8Array(buffer);
      }

      return {
        buffer: zipSync(zipEntries),
        filename: `${sanitizeZipSegment(folder.name)}.zip`,
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw wrapRepositoryError(error);
    }
  }

  async permanentDeleteFolder(id: string, userId: string): Promise<void> {
    try {
      const folderIds = await this.collectFolderIds(id, userId);
      await this.permanentDeleteFilesInFolders(folderIds, userId);
      await this.deleteFoldersFromDb(folderIds, userId);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  private async collectFolderZipEntries(
    folderId: string,
    userId: string,
    pathPrefix: string,
  ): Promise<FolderZipEntry[]> {
    const entries: FolderZipEntry[] = [];

    const files = await this.fileRepository.findByUserId(userId, folderId);
    for (const file of files) {
      if (file.trashedAt) continue;
      entries.push({
        zipPath: `${pathPrefix}/${sanitizeZipSegment(file.name)}`,
        mimeType: file.mimeType,
        key: file.key,
      });
    }

    const children = await this.folderRepository.findByUserId(userId, folderId);
    for (const child of children) {
      if (child.trashedAt) continue;
      const nested = await this.collectFolderZipEntries(
        child.id,
        userId,
        `${pathPrefix}/${sanitizeZipSegment(child.name)}`,
      );
      entries.push(...nested);
    }

    return entries;
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

  private async permanentDeleteFilesInFolders(folderIds: string[], userId: string): Promise<void> {
    for (const folderId of folderIds) {
      const files = await this.fileRepository.findByUserId(userId, folderId);
      for (const file of files) {
        await this.storage.delete(file.key).catch(() => {});
        if (file.thumbnailKey) {
          await this.storage.delete(file.thumbnailKey).catch(() => {});
        }
        await this.fileRepository.permanentDelete(file.id, userId);
      }
    }
  }

  private async deleteFoldersFromDb(folderIds: string[], userId: string): Promise<void> {
    for (let i = folderIds.length - 1; i >= 0; i--) {
      await this.folderRepository.permanentDelete(folderIds[i], userId);
    }
  }
}

function sanitizeZipSegment(name: string): string {
  return name.replace(/[/\\]/g, '_').replace(/\0/g, '') || 'untitled';
}
