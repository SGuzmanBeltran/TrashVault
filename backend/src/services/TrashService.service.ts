import { FileEntity, FileRepositoryPort } from '../ports/repository/FileRepository.port';
import { FolderEntity, FolderRepositoryPort } from '../ports/repository/FolderRepository.port';
import { StoragePort } from '../ports/storage/Storage.port';
import { wrapRepositoryError } from '../errors';
import { mapInParallel } from '../lib/mapInParallel';

export interface TrashData {
  files: FileEntity[];
  folders: FolderEntity[];
}

const STORAGE_DELETE_CONCURRENCY = 20;

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
      await this.folderRepository.restoreManyFromTrash(folderIds, userId);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  async permanentDeleteFile(id: string, userId: string): Promise<void> {
    try {
      const file = await this.fileRepository.findById(id, userId);
      if (!file) return;

      await this.deleteFilesFromStorage([file]);
      await this.fileRepository.permanentDelete(id, userId);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  async permanentDeleteFolder(id: string, userId: string): Promise<void> {
    try {
      const trashedFolders = await this.folderRepository.findTrashedByUserId(userId);
      const folderIds = this.collectTrashedFolderDescendants(id, trashedFolders);
      const filesToPurge = await this.fileRepository.findActiveByFolderIds(userId, folderIds);

      await this.deleteFilesFromStorage(filesToPurge);
      await Promise.all([
        this.fileRepository.permanentDeleteMany(
          filesToPurge.map((file) => file.id),
          userId,
        ),
        this.folderRepository.permanentDeleteMany(folderIds, userId),
      ]);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  async emptyTrash(userId: string): Promise<void> {
    try {
      const trashedFolders = await this.folderRepository.findTrashedByUserId(userId);
      const folderIds = trashedFolders.map((folder) => folder.id);

      const [trashedFiles, filesInFolders] = await Promise.all([
        this.fileRepository.findTrashedByUserId(userId),
        this.fileRepository.findActiveByFolderIds(userId, folderIds),
      ]);

      const filesToPurge = this.dedupeFiles([...trashedFiles, ...filesInFolders]);
      await this.deleteFilesFromStorage(filesToPurge);

      await Promise.all([
        this.fileRepository.permanentDeleteMany(
          filesToPurge.map((file) => file.id),
          userId,
        ),
        this.folderRepository.emptyTrash(userId),
      ]);
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

  private dedupeFiles(files: FileEntity[]): FileEntity[] {
    const byId = new Map<string, FileEntity>();
    for (const file of files) {
      byId.set(file.id, file);
    }
    return Array.from(byId.values());
  }

  private async deleteFilesFromStorage(files: FileEntity[]): Promise<void> {
    const keys: string[] = [];
    for (const file of files) {
      keys.push(file.key);
      if (file.thumbnailKey) {
        keys.push(file.thumbnailKey);
      }
    }

    await mapInParallel(keys, STORAGE_DELETE_CONCURRENCY, (key) =>
      this.storage.delete(key).catch(() => {}),
    );
  }
}
