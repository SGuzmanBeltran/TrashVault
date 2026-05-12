import { StoragePort } from '../ports/storage/Storage.port'
import { execFile } from 'child_process'
import { promisify } from 'util'
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
      return output.buffer
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(500, 'Failed to generate image thumbnail');
    }
  }

  async generateVideoThumbnail(buffer: ArrayBuffer): Promise<ArrayBuffer> {
    try {
      const { stdout } = await execFileAsync(
        'ffmpeg',
        [
          '-i',
          'pipe:0',
          '-ss',
          '00:00:01',
          '-vframes',
          '1',
          '-f',
          'image2pipe',
          '-vcodec',
          'mjpeg',
          '-q:v',
          '5',
          '-loglevel',
          'error',
          'pipe:1',
        ],
        {
          input: Buffer.from(buffer),
          maxBuffer: 50 * 1024 * 1024,
          encoding: 'buffer' as BufferEncoding,
        },
      )

      return stdout.buffer
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(500, 'Failed to generate video thumbnail');
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

      if (IMAGE_MIMES.has(mimeType)) {
        thumbnailBuffer = await this.generateImageThumbnail(buffer)
      } else if (VIDEO_MIMES.has(mimeType)) {
        thumbnailBuffer = await this.generateVideoThumbnail(buffer)
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
      console.warn('Thumbnail generation failed:', error)
      return null
    }
  }
}
