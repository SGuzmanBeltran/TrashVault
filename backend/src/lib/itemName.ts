import { ServiceError } from '../errors';

export function sanitizeItemName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new ServiceError(400, 'Name cannot be empty');
  }
  if (/[/\\]/.test(trimmed)) {
    throw new ServiceError(400, 'Name cannot contain / or \\');
  }
  return trimmed;
}
