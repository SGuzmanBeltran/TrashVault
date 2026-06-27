export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = '20MB';
export const MAX_UPLOAD_FILE_COUNT = 10;

export function isFileWithinSizeLimit(file: File): boolean {
  return file.size <= MAX_FILE_SIZE_BYTES;
}

export function fileSizeLimitMessage(fileName: string): string {
  return `"${fileName}" exceeds the ${MAX_FILE_SIZE_LABEL} size limit`;
}

export function uploadCountLimitMessage(): string {
  return `You can upload up to ${MAX_UPLOAD_FILE_COUNT} files at a time`;
}
