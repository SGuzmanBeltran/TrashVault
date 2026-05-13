import type { EncryptionPort } from '@/ports'
import { apiFetchJSON } from '@/lib/api-fetch'

interface BackendEncryptionKey {
  userId: string
  encryptedDek: string
  dekIv: string
  dekSalt: string
  kdfAlgorithm: string
  kdfParams: string
  createdAt: string
  updatedAt: string
}

export class HttpEncryptionAdapter implements EncryptionPort {
  async getKey(): Promise<BackendEncryptionKey> {
    return apiFetchJSON<BackendEncryptionKey>('/user/encryption-key')
  }

  async createKey(params: {
    encryptedDek: string
    dekIv: string
    dekSalt: string
    kdfAlgorithm: string
    kdfParams: string
  }): Promise<BackendEncryptionKey> {
    return apiFetchJSON<BackendEncryptionKey>('/user/encryption-key', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async updateKey(params: {
    encryptedDek: string
    dekIv: string
    dekSalt: string
    kdfAlgorithm: string
    kdfParams: string
  }): Promise<BackendEncryptionKey> {
    return apiFetchJSON<BackendEncryptionKey>('/user/encryption-key', {
      method: 'PUT',
      body: JSON.stringify(params),
    })
  }
}
