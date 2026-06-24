export interface NewFile {
  id: string;
  userId: string;
  name: string;
  mimeType: string;
  size: number;
  bucket: string;
  key: string;
  folderId: string | null;
  thumbnailKey: string | null;
  createdAt: Date;
  trashedAt: Date | null;
}

export interface FileEntity extends NewFile {}

export interface FileRepositoryPort {
  create(data: NewFile): Promise<FileEntity>;
  findById(id: string, userId: string): Promise<FileEntity | null>;
  findByUserId(userId: string, folderId?: string | null): Promise<FileEntity[]>;
  delete(id: string, userId: string): Promise<void>;
  updateFolderId(id: string, userId: string, folderId: string | null): Promise<FileEntity | null>;
  moveToTrash(id: string, userId: string): Promise<void>;
  restoreFromTrash(id: string, userId: string): Promise<void>;
  findTrashedByUserId(userId: string): Promise<FileEntity[]>;
  searchByName(userId: string, query: string): Promise<FileEntity[]>;
  permanentDelete(id: string, userId: string): Promise<void>;
  emptyTrash(userId: string): Promise<void>;
}