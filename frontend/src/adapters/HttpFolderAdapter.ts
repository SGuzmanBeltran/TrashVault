import type { FolderPort } from '@/ports'
import type { Folder } from '@/domain/types'
import { apiFetchJSON } from '@/lib/api-fetch'
import { decryptFile } from '@/lib/crypto'
import { useVaultStore } from '@/stores/vault'
import { unzipSync, zipSync } from 'fflate'

interface BackendFolder {
  id: string
  name: string
  parentId: string | null
  createdAt: string
  trashedAt: string | null
}

interface FolderZipManifest {
  version: 1
  files: { path: string; mimeType: string }[]
}

const MANIFEST_PATH = '__trashvault__/manifest.json'

function mapFolder(item: BackendFolder): Folder {
  return {
    id: item.id,
    name: item.name,
    parentId: item.parentId,
    createdAt: new Date(item.createdAt).toISOString(),
    trashedAt: item.trashedAt ? new Date(item.trashedAt).toISOString() : null,
  }
}

export class HttpFolderAdapter implements FolderPort {
  async listFolders(parentId: string | null): Promise<Folder[]> {
    const query = parentId !== null ? `?parentId=${parentId}` : ''
    const items = await apiFetchJSON<BackendFolder[]>(`/folders${query}`)
    return items.map(mapFolder)
  }

  async getFolder(id: string): Promise<Folder> {
    const item = await apiFetchJSON<BackendFolder>(`/folders/${id}`)
    return mapFolder(item)
  }

  async createFolder(name: string, parentId: string | null): Promise<Folder> {
    const item = await apiFetchJSON<BackendFolder>('/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    })
    return mapFolder(item)
  }

  async deleteFolder(id: string): Promise<void> {
    await apiFetchJSON(`/folders/${id}`, { method: 'DELETE' })
  }

  async moveFolder(id: string, parentId: string | null): Promise<Folder> {
    const item = await apiFetchJSON<BackendFolder>(`/folders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ parentId }),
    })
    return mapFolder(item)
  }

  async downloadFolder(id: string): Promise<{ blobUrl: string; filename: string }> {
    const vaultStore = useVaultStore()
    if (!vaultStore.dek) throw new Error('Vault is locked')

    const folder = await this.getFolder(id)
    const resp = await fetch(`/api/folders/${id}/download`, { credentials: 'include' })
    if (!resp.ok) throw new Error('Failed to download folder')

    const encryptedZip = new Uint8Array(await resp.arrayBuffer())
    const contents = unzipSync(encryptedZip)
    const manifestBytes = contents[MANIFEST_PATH]
    if (!manifestBytes) throw new Error('Invalid folder archive')

    const manifest = JSON.parse(new TextDecoder().decode(manifestBytes)) as FolderZipManifest
    const decryptedZip: Record<string, Uint8Array> = {}

    for (const file of manifest.files) {
      const encrypted = contents[file.path]
      if (!encrypted) continue
      const encryptedBuffer = encrypted.slice().buffer as ArrayBuffer
      const plaintext = await decryptFile(encryptedBuffer, vaultStore.dek)
      decryptedZip[file.path] = new Uint8Array(plaintext)
    }

    const blob = new Blob([zipSync(decryptedZip)], { type: 'application/zip' })
    return {
      blobUrl: URL.createObjectURL(blob),
      filename: `${folder.name}.zip`,
    }
  }
}
