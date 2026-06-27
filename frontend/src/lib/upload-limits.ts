export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MAX_FILE_SIZE_LABEL = `${MAX_FILE_SIZE_MB}MB`;
export const MAX_UPLOAD_FILE_COUNT = 20;

export function isFileWithinSizeLimit(file: File): boolean {
  return file.size <= MAX_FILE_SIZE_BYTES;
}

export function fileSizeLimitMessage(fileName: string): string {
  return `"${fileName}" exceeds the ${MAX_FILE_SIZE_LABEL} size limit`;
}

export function uploadCountLimitMessage(): string {
  return `You can upload up to ${MAX_UPLOAD_FILE_COUNT} files at a time`;
}
