import { StoragePort } from '../ports/storage/Storage.port'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'
import sharp from 'sharp'
import { ServiceError, wrapStorageError } from '../errors'

const execFileAsync = promisify(execFile)

const THUMBNAIL_MAX_DIM = 300
const THUMBNAIL_QUALITY = 80

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/tiff',
  'image/gif',
])

const VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
])

export class ThumbnailService {
  constructor(private storage: StoragePort) {}

  getThumbnailKey(fileKey: string): string {
    return fileKey.replace(/^files\//, 'thumbnails/').replace(/\.[^.]+$/, '.jpg')
  }

  async generateImageThumbnail(buffer: ArrayBuffer): Promise<ArrayBuffer> {
    try {
      const image = sharp(Buffer.from(buffer), { failOn: 'none' })
        .resize(THUMBNAIL_MAX_DIM, THUMBNAIL_MAX_DIM, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: THUMBNAIL_QUALITY })
        .rotate()

      const output = await image.toBuffer()
      return Uint8Array.from(output).buffer
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(500, 'Failed to generate image thumbnail');
    }
  }

  async generateVideoThumbnail(buffer: ArrayBuffer): Promise<ArrayBuffer> {
    const inputPath = join(tmpdir(), `tv-in-${randomUUID()}`)
    const outputPath = join(tmpdir(), `tv-out-${randomUUID()}.jpg`)

    try {
      await writeFile(inputPath, Buffer.from(buffer))

      await execFileAsync(
        'ffmpeg',
        [
          '-i', inputPath,
          '-ss', '00:00:01',
          '-vframes', '1',
          '-f', 'image2pipe',
          '-vcodec', 'mjpeg',
          '-q:v', '5',
          '-loglevel', 'error',
          outputPath,
        ],
        { timeout: 30_000 },
      )

      const output = await readFile(outputPath)
      return Uint8Array.from(output).buffer
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(500, 'Failed to generate video thumbnail');
    } finally {
      await unlink(inputPath).catch(() => {})
      await unlink(outputPath).catch(() => {})
    }
  }

  async shouldGenerate(mimeType: string): Promise<boolean> {
    return IMAGE_MIMES.has(mimeType) || VIDEO_MIMES.has(mimeType)
  }

  async generateAndUpload(
    buffer: ArrayBuffer,
    mimeType: string,
    fileKey: string,
  ): Promise<string | null> {
    try {
      let thumbnailBuffer: ArrayBuffer

      if (VIDEO_MIMES.has(mimeType)) {
        thumbnailBuffer = await this.generateVideoThumbnail(buffer)
      } else if (IMAGE_MIMES.has(mimeType)) {
        thumbnailBuffer = await this.generateImageThumbnail(buffer)
      } else {
        return null
      }

      const thumbnailKey = this.getThumbnailKey(fileKey)
      try {
        await this.storage.upload(thumbnailBuffer, thumbnailKey, 'image/jpeg')
      } catch (error) {
        throw wrapStorageError(error)
      }
      return thumbnailKey
    } catch (error) {
      console.warn(`Thumbnail generation failed for ${mimeType}:`, error instanceof Error ? error.message : error)
      return null
    }
  }
}
