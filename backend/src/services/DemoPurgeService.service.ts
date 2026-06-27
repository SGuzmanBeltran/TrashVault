import { FileEntity, FileRepositoryPort } from '../ports/repository/FileRepository.port';
import { FolderRepositoryPort } from '../ports/repository/FolderRepository.port';
import { StoragePort } from '../ports/storage/Storage.port';
import { wrapRepositoryError } from '../errors';
import { mapInParallel } from '../lib/mapInParallel';

const STORAGE_DELETE_CONCURRENCY = 20;

export interface DemoPurgeResult {
  filesDeleted: number;
  foldersDeleted: number;
}

export class DemoPurgeService {
  constructor(
    private fileRepository: FileRepositoryPort,
    private folderRepository: FolderRepositoryPort,
    private storage: StoragePort,
  ) {}

  async purgeAllContent(maxAgeMs: number | null): Promise<DemoPurgeResult> {
    try {
      const createdBefore = maxAgeMs ? new Date(Date.now() - maxAgeMs) : null;

      const [filesToDelete, foldersToDelete] = await Promise.all([
        this.fileRepository.findAll(createdBefore),
        this.folderRepository.findAll(createdBefore),
      ]);

      await this.deleteFilesFromStorage(filesToDelete);

      await Promise.all([
        this.fileRepository.deleteMany(filesToDelete.map((file) => file.id)),
        this.folderRepository.deleteMany(foldersToDelete.map((folder) => folder.id)),
      ]);

      return {
        filesDeleted: filesToDelete.length,
        foldersDeleted: foldersToDelete.length,
      };
    } catch (error) {
      throw wrapRepositoryError(error);
    }
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
