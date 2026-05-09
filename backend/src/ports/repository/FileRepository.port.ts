export interface NewFile {
  id: string;
  userId: string;
  name: string;
  mimeType: string;
  size: number;
  bucket: string;
  key: string;
  folderId: string | null;
  createdAt: Date;
}

export interface FileEntity extends NewFile {}

export interface FileRepositoryPort {
  create(data: NewFile): Promise<FileEntity>;
  findById(id: string, userId: string): Promise<FileEntity | null>;
  findByUserId(userId: string, folderId?: string | null): Promise<FileEntity[]>;
  delete(id: string, userId: string): Promise<void>;
}