import type { FolderPort } from '@/ports'
import type { FolderApiPort } from '@/ports/http/FolderApi.port'
import { decryptFolderZip } from '@/lib/folder-archive'

type DekProvider = () => CryptoKey | null

export class FolderService implements FolderPort {
  constructor(
    private folderApi: FolderApiPort,
    private getDek: DekProvider,
  ) {}

  listFolders(parentId: string | null) {
    return this.folderApi.listFolders(parentId)
  }

  getFolder(id: string) {
    return this.folderApi.getFolder(id)
  }

  createFolder(name: string, parentId: string | null) {
    return this.folderApi.createFolder(name, parentId)
  }

  deleteFolder(id: string) {
    return this.folderApi.deleteFolder(id)
  }

  moveFolder(id: string, parentId: string | null) {
    return this.folderApi.moveFolder(id, parentId)
  }

  renameFolder(id: string, name: string) {
    return this.folderApi.renameFolder(id, name)
  }

  async downloadFolder(id: string) {
    const dek = this.getDek()
    if (!dek) throw new Error('Vault is locked')

    const folder = await this.folderApi.getFolder(id)
    const encryptedZip = await this.folderApi.fetchFolderZipBytes(id)
    const decryptedZip = await decryptFolderZip(encryptedZip, dek)
    const blob = new Blob([new Uint8Array(decryptedZip)], { type: 'application/zip' })

    return {
      blobUrl: URL.createObjectURL(blob),
      filename: `${folder.name}.zip`,
    }
  }
}
