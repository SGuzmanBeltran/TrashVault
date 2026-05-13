import type { FilePort, FolderPort, AuthPort, StatsPort, TrashPort, EncryptionPort } from '@/ports'
import { HttpFileAdapter } from '@/adapters/HttpFileAdapter'
import { HttpFolderAdapter } from '@/adapters/HttpFolderAdapter'
import { HttpAuthAdapter } from '@/adapters/HttpAuthAdapter'
import { HttpStatsAdapter } from '@/adapters/HttpStatsAdapter'
import { HttpTrashAdapter } from '@/adapters/HttpTrashAdapter'
import { HttpEncryptionAdapter } from '@/adapters/HttpEncryptionAdapter'

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

container.register<FilePort>('FilePort', new HttpFileAdapter())
container.register<FolderPort>('FolderPort', new HttpFolderAdapter())
container.register<AuthPort>('AuthPort', new HttpAuthAdapter())
container.register<StatsPort>('StatsPort', new HttpStatsAdapter())
container.register<TrashPort>('TrashPort', new HttpTrashAdapter())
container.register<EncryptionPort>('EncryptionPort', new HttpEncryptionAdapter())
