import { FolderRepositoryPort, FolderEntity } from '../ports/repository/FolderRepository.port';

export interface CreateFolderParams {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
}

export class FolderService {
  constructor(private folderRepository: FolderRepositoryPort) {}

  async createFolder(params: CreateFolderParams): Promise<FolderEntity> {
    return this.folderRepository.create({
      id: params.id,
      userId: params.userId,
      name: params.name,
      parentId: params.parentId,
      createdAt: Date.now(),
    });
  }

  async getFolder(id: string): Promise<FolderEntity | null> {
    return this.folderRepository.findById(id);
  }

  async getFoldersByUser(userId: string, parentId?: string | null): Promise<FolderEntity[]> {
    return this.folderRepository.findByUserId(userId, parentId);
  }

  async deleteFolder(id: string): Promise<void> {
    await this.folderRepository.delete(id);
  }
}