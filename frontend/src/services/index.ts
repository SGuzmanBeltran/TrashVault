import type { FilePort, FolderPort, AuthPort, StatsPort } from '@/ports'
import { container } from '@/container'

export function useFileService(): FilePort {
  return container.get<FilePort>('FilePort')
}

export function useFolderService(): FolderPort {
  return container.get<FolderPort>('FolderPort')
}

export function useAuthService(): AuthPort {
  return container.get<AuthPort>('AuthPort')
}

export function useStatsService(): StatsPort {
  return container.get<StatsPort>('StatsPort')
}
