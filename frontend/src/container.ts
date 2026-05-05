import type { FilePort, FolderPort, AuthPort, StatsPort } from '@/ports'
import { MockFileAdapter } from '@/adapters/MockFileAdapter'
import { MockFolderAdapter } from '@/adapters/MockFolderAdapter'
import { MockAuthAdapter } from '@/adapters/MockAuthAdapter'
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

container.register<FilePort>('FilePort', new MockFileAdapter())
container.register<FolderPort>('FolderPort', new MockFolderAdapter())
container.register<AuthPort>('AuthPort', new MockAuthAdapter())
container.register<StatsPort>('StatsPort', new MockStatsAdapter())
