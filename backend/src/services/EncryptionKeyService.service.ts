import {
  EncryptionKey,
  EncryptionKeyRepositoryPort,
  NewEncryptionKey,
  UpdateEncryptionKey,
} from '../ports/repository/EncryptionKeyRepository.port';
import { NotFoundError, wrapRepositoryError } from '../errors';

export class EncryptionKeyService {
  constructor(private encryptionKeyRepository: EncryptionKeyRepositoryPort) {}

  async createKey(params: NewEncryptionKey): Promise<EncryptionKey> {
    try {
      return await this.encryptionKeyRepository.create(params);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }

  async getKey(userId: string): Promise<EncryptionKey> {
    try {
      const key = await this.encryptionKeyRepository.findByUserId(userId);
      if (!key) {
        throw new NotFoundError('Encryption key not found');
      }
      return key;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw wrapRepositoryError(error);
    }
  }

  async updateKey(userId: string, data: UpdateEncryptionKey): Promise<EncryptionKey> {
    try {
      return await this.encryptionKeyRepository.update(userId, data);
    } catch (error) {
      throw wrapRepositoryError(error);
    }
  }
}
