import type { SearchPort } from '@/ports'
import { apiFetchJSON } from '@/lib/api-fetch'
import { mapFile, mapFolder, type BackendFileItem, type BackendFolder } from '@/adapters/mappers'

export class HttpSearchAdapter implements SearchPort {
  async search(query: string) {
    const params = new URLSearchParams({ q: query })
    const result = await apiFetchJSON<{ files: BackendFileItem[]; folders: BackendFolder[] }>(
      `/search?${params.toString()}`,
    )
    return {
      files: result.files.map(mapFile),
      folders: result.folders.map(mapFolder),
    }
  }
}
