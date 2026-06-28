import type { FilePort, FolderPort, AuthPort, StatsPort, TrashPort, EncryptionPort, SearchPort } from '@/ports'
import { HttpFileAdapter } from '@/adapters/HttpFileAdapter'
import { HttpFolderAdapter } from '@/adapters/HttpFolderAdapter'
import { HttpAuthAdapter } from '@/adapters/HttpAuthAdapter'
import { HttpStatsAdapter } from '@/adapters/HttpStatsAdapter'
import { HttpTrashAdapter } from '@/adapters/HttpTrashAdapter'
import { HttpEncryptionAdapter } from '@/adapters/HttpEncryptionAdapter'
import { HttpSearchAdapter } from '@/adapters/HttpSearchAdapter'
import { FileService } from '@/services/FileService'
import { FolderService } from '@/services/FolderService'
import { useVaultStore } from '@/stores/vault'

class Container {
  private instances = new Map<string, unknown>()

  register<T>(key: string, instance: T): void {
    this.instances.set(key, instance)
  }

  get<T>(key: string): T {
    const instance = this.instances.get(key)
    if (!instance) throw new Error(`No registration found for: ${key}`)
    return instance as T
  }
}

export const container = new Container()

function getDek(): CryptoKey | null {
  return useVaultStore().dek
}

const httpFileAdapter = new HttpFileAdapter()
const httpFolderAdapter = new HttpFolderAdapter()

container.register<FilePort>('FilePort', new FileService(httpFileAdapter, getDek))
container.register<FolderPort>('FolderPort', new FolderService(httpFolderAdapter, getDek))
container.register<AuthPort>('AuthPort', new HttpAuthAdapter())
container.register<StatsPort>('StatsPort', new HttpStatsAdapter())
container.register<TrashPort>('TrashPort', new HttpTrashAdapter())
container.register<EncryptionPort>('EncryptionPort', new HttpEncryptionAdapter())
container.register<SearchPort>('SearchPort', new HttpSearchAdapter())
