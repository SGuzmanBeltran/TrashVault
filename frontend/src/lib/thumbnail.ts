const THUMBNAIL_MAX_DIM = 300
const THUMBNAIL_QUALITY = 0.8

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
])

const VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

export function canGenerateThumbnail(mimeType: string): boolean {
  return IMAGE_MIMES.has(mimeType) || VIDEO_MIMES.has(mimeType)
}

export async function generateThumbnail(file: File): Promise<Blob | null> {
  if (IMAGE_MIMES.has(file.type)) {
    return generateImageThumbnail(file)
  }

  if (VIDEO_MIMES.has(file.type)) {
    return generateVideoThumbnail(file)
  }

  return null
}

function generateImageThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const { width, height } = resizeDimensions(img.width, img.height)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to generate thumbnail'))
        },
        'image/jpeg',
        THUMBNAIL_QUALITY,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

function generateVideoThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)

    video.preload = 'metadata'
    video.muted = true

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 4)
    }

    video.onseeked = () => {
      URL.revokeObjectURL(url)

      const { width, height } = resizeDimensions(video.videoWidth, video.videoHeight)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(video, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to generate thumbnail'))
        },
        'image/jpeg',
        THUMBNAIL_QUALITY,
      )
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video'))
    }

    video.src = url
  })
}

function resizeDimensions(width: number, height: number): { width: number; height: number } {
  if (width <= THUMBNAIL_MAX_DIM && height <= THUMBNAIL_MAX_DIM) {
    return { width, height }
  }

  const ratio = Math.min(THUMBNAIL_MAX_DIM / width, THUMBNAIL_MAX_DIM / height)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}
