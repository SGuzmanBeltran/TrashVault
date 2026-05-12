export interface NewFolder {
  id: string;
  userId: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
  trashedAt: Date | null;
}

export interface FolderEntity extends NewFolder {}

export interface FolderRepositoryPort {
  create(data: NewFolder): Promise<FolderEntity>;
  findById(id: string, userId: string): Promise<FolderEntity | null>;
  findByUserId(userId: string, parentId?: string | null): Promise<FolderEntity[]>;
  delete(id: string, userId: string): Promise<void>;
  moveToTrash(id: string, userId: string): Promise<void>;
  restoreFromTrash(id: string, userId: string): Promise<void>;
  findTrashedByUserId(userId: string): Promise<FolderEntity[]>;
  permanentDelete(id: string, userId: string): Promise<void>;
  emptyTrash(userId: string): Promise<void>;
}