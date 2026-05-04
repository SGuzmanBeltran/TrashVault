import { FileRepositoryPort, FileEntity } from '../ports/repository/FileRepository.port';
import { StoragePort } from '../ports/storage/Storage.port';

export interface CreateFileParams {
  id: string;
  userId: string;
  name: string;
  mimeType: string;
  size: number;
  bucket: string;
  key: string;
  folderId: string | null;
  buffer: ArrayBuffer;
}

export class FileService {
  constructor(
    private fileRepository: FileRepositoryPort,
    private storage: StoragePort
  ) {}

  async createFile(params: CreateFileParams): Promise<FileEntity> {
    await this.storage.upload(params.buffer, params.key, params.mimeType);

    return this.fileRepository.create({
      id: params.id,
      userId: params.userId,
      name: params.name,
      mimeType: params.mimeType,
      size: params.size,
      bucket: params.bucket,
      key: params.key,
      folderId: params.folderId,
      createdAt: Date.now(),
    });
  }

  async getFile(id: string): Promise<FileEntity | null> {
    return this.fileRepository.findById(id);
  }

  async getFilesByUser(userId: string, folderId?: string | null): Promise<FileEntity[]> {
    return this.fileRepository.findByUserId(userId, folderId);
  }

  async deleteFile(id: string): Promise<void> {
    const file = await this.fileRepository.findById(id);
    if (!file) return;

    await this.storage.delete(file.key);
    await this.fileRepository.delete(id);
  }

  async getDownloadUrl(id: string, expiresIn: number = 3600): Promise<string | null> {
    const file = await this.fileRepository.findById(id);
    if (!file) return null;

    return this.storage.getSignedUrl(file.key, expiresIn);
  }
}