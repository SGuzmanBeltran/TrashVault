import type { FilePort, FolderPort, AuthPort, StatsPort } from '@/ports'
import { HttpFileAdapter } from '@/adapters/HttpFileAdapter'
import { MockFolderAdapter } from '@/adapters/MockFolderAdapter'
import { HttpAuthAdapter } from '@/adapters/HttpAuthAdapter'
import { MockStatsAdapter } from '@/adapters/MockStatsAdapter'

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
container.register<FolderPort>('FolderPort', new MockFolderAdapter())
container.register<AuthPort>('AuthPort', new HttpAuthAdapter())
container.register<StatsPort>('StatsPort', new MockStatsAdapter())
