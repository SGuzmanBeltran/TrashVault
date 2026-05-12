import { FolderRepositoryPort, FolderEntity } from '../ports/repository/FolderRepository.port';
import { wrapRepositoryError } from '../errors';

export interface CreateFolderParams {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
}

export class FolderService {
  constructor(private folderRepository: FolderRepositoryPort) {}

  async createFolder(params: CreateFolderParams): Promise<FolderEntity> {
    try {
      return await this.folderRepository.create({
        id: params.id,
        userId: params.userId,
        name: params.name,
        parentId: params.parentId,
        createdAt: new Date(),
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
      await this.folderRepository.delete(id, userId);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }
}