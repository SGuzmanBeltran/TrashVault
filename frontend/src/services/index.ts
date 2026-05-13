import type { FilePort, FolderPort, AuthPort, StatsPort, TrashPort, EncryptionPort } from '@/ports'
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

export function useTrashService(): TrashPort {
  return container.get<TrashPort>('TrashPort')
}

export function useEncryptionService(): EncryptionPort {
  return container.get<EncryptionPort>('EncryptionPort')
}
