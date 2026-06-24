import { FileEntity, FileRepositoryPort } from '../ports/repository/FileRepository.port';
import { FolderEntity, FolderRepositoryPort } from '../ports/repository/FolderRepository.port';
import { wrapRepositoryError } from '../errors';

export interface SearchFileResult extends FileEntity {
  path: string;
}

export interface SearchFolderResult extends FolderEntity {
  path: string;
}

export interface SearchResults {
  files: SearchFileResult[];
  folders: SearchFolderResult[];
}

export class SearchService {
  constructor(
    private fileRepository: FileRepositoryPort,
    private folderRepository: FolderRepositoryPort,
  ) {}

  async search(userId: string, rawQuery: string): Promise<SearchResults> {
    const query = rawQuery.trim();
    if (!query) {
      return { files: [], folders: [] };
    }

    try {
      const [matchedFiles, matchedFolders, allFolders] = await Promise.all([
        this.fileRepository.searchByName(userId, query),
        this.folderRepository.searchByName(userId, query),
        this.folderRepository.findAllActiveByUserId(userId),
      ]);

      const folderMap = new Map(allFolders.map((folder) => [folder.id, folder]));
      const buildPath = (folderId: string | null): string => {
        if (!folderId) return 'My Files';

        const parts: string[] = [];
        let current: string | null = folderId;
        const visited = new Set<string>();

        while (current) {
          if (visited.has(current)) break;
          visited.add(current);

          const folder = folderMap.get(current);
          if (!folder) break;

          parts.unshift(folder.name);
          current = folder.parentId;
        }

        return parts.length ? `My Files / ${parts.join(' / ')}` : 'My Files';
      };

      return {
        files: matchedFiles.map((file) => ({
          ...file,
          path: buildPath(file.folderId),
        })),
        folders: matchedFolders.map((folder) => ({
          ...folder,
          path: buildPath(folder.parentId),
        })),
      };
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }
}
