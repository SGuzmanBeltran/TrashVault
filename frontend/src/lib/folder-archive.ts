import { unzipSync, zipSync } from 'fflate'
import { decryptFile } from '@/lib/crypto'

export const FOLDER_ZIP_MANIFEST_PATH = '__trashvault__/manifest.json'

export interface FolderZipManifest {
  version: 1
  files: { path: string; mimeType: string }[]
}

export async function decryptFolderZip(encryptedZip: ArrayBuffer, dek: CryptoKey): Promise<Uint8Array> {
  const contents = unzipSync(new Uint8Array(encryptedZip))
  const manifestBytes = contents[FOLDER_ZIP_MANIFEST_PATH]
  if (!manifestBytes) throw new Error('Invalid folder archive')

  const manifest = JSON.parse(new TextDecoder().decode(manifestBytes)) as FolderZipManifest
  const decryptedZip: Record<string, Uint8Array> = {}

  for (const file of manifest.files) {
    const encrypted = contents[file.path]
    if (!encrypted) continue
    const encryptedBuffer = encrypted.slice().buffer as ArrayBuffer
    const plaintext = await decryptFile(encryptedBuffer, dek)
    decryptedZip[file.path] = new Uint8Array(plaintext)
  }

  return zipSync(decryptedZip)
}
