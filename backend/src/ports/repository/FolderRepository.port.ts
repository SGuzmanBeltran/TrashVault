export interface NewFolder {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
}

export interface FolderEntity extends NewFolder {}

export interface FolderRepositoryPort {
  create(data: NewFolder): Promise<FolderEntity>;
  findById(id: string, userId: string): Promise<FolderEntity | null>;
  findByUserId(userId: string, parentId?: string | null): Promise<FolderEntity[]>;
  delete(id: string, userId: string): Promise<void>;
}