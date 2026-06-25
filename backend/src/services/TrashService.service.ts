import { FileEntity, FileRepositoryPort } from '../ports/repository/FileRepository.port';
import { FolderEntity, FolderRepositoryPort } from '../ports/repository/FolderRepository.port';
import { StoragePort } from '../ports/storage/Storage.port';
import { wrapRepositoryError } from '../errors';

export interface TrashData {
  files: FileEntity[];
  folders: FolderEntity[];
}

export class TrashService {
  constructor(
    private fileRepository: FileRepositoryPort,
    private folderRepository: FolderRepositoryPort,
    private storage: StoragePort,
  ) {}

  async getTrash(userId: string): Promise<TrashData> {
    try {
      const [files, folders] = await Promise.all([
        this.fileRepository.findTrashedByUserId(userId),
        this.folderRepository.findTrashedByUserId(userId),
      ]);
      return { files, folders };
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  async restoreFile(id: string, userId: string): Promise<void> {
    try {
      await this.fileRepository.restoreFromTrash(id, userId);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  async restoreFolder(id: string, userId: string): Promise<void> {
    try {
      const trashedFolders = await this.folderRepository.findTrashedByUserId(userId);
      const folderIds = this.collectTrashedFolderDescendants(id, trashedFolders);
      for (const folderId of folderIds) {
        await this.folderRepository.restoreFromTrash(folderId, userId);
      }
    } catch (error) {
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
      throw wrapRepositoryError(error);
    }
  }

  async permanentDeleteFolder(id: string, userId: string): Promise<void> {
    try {
      const trashedFolders = await this.folderRepository.findTrashedByUserId(userId);
      const folderIds = this.collectTrashedFolderDescendants(id, trashedFolders);
      await this.permanentDeleteFilesInFolders(folderIds, userId);
      for (let i = folderIds.length - 1; i >= 0; i--) {
        await this.folderRepository.permanentDelete(folderIds[i], userId);
      }
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  async emptyTrash(userId: string): Promise<void> {
    try {
      const trashedFolders = await this.folderRepository.findTrashedByUserId(userId);
      await this.permanentDeleteFilesInFolders(
        trashedFolders.map((folder) => folder.id),
        userId,
      );

      const trashedFiles = await this.fileRepository.findTrashedByUserId(userId);
      for (const file of trashedFiles) {
        await this.storage.delete(file.key).catch(() => {});
        if (file.thumbnailKey) {
          await this.storage.delete(file.thumbnailKey).catch(() => {});
        }
      }

      await this.fileRepository.emptyTrash(userId);
      await this.folderRepository.emptyTrash(userId);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  private collectTrashedFolderDescendants(
    rootId: string,
    trashedFolders: FolderEntity[],
  ): string[] {
    const childrenByParent = new Map<string, FolderEntity[]>();
    for (const folder of trashedFolders) {
      const parentKey = folder.parentId ?? '';
      const siblings = childrenByParent.get(parentKey);
      if (siblings) {
        siblings.push(folder);
      } else {
        childrenByParent.set(parentKey, [folder]);
      }
    }

    const ids: string[] = [rootId];
    const queue: string[] = [rootId];

    while (queue.length > 0) {
      const parentId = queue.shift()!;
      for (const child of childrenByParent.get(parentId) ?? []) {
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
}
