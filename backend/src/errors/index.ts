export class ServiceError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends ServiceError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class ConflictError extends ServiceError {
  constructor(message = 'Resource already exists') {
    super(409, message);
  }
}

export class DatabaseError extends ServiceError {
  constructor(message = 'A database error occurred') {
    super(500, message);
  }
}

export class StorageError extends ServiceError {
  constructor(message = 'A storage error occurred') {
    super(500, message);
  }
}

const UNIQUE_VIOLATION = '23505';
const NOT_NULL_VIOLATION = '23502';
const FOREIGN_KEY_VIOLATION = '23503';

export function wrapRepositoryError(error: unknown): ServiceError {
  if (error instanceof ServiceError) return error;

  const cause = error instanceof Error ? error : undefined;
  const pgCode = (cause as any)?.code ?? (error as any)?.cause?.code;

  if (pgCode === UNIQUE_VIOLATION) {
    return new ConflictError();
  }

  if (pgCode === NOT_NULL_VIOLATION || pgCode === FOREIGN_KEY_VIOLATION) {
    return new DatabaseError('Invalid data provided');
  }

  console.error('Unhandled repository error:', error);
  return new DatabaseError();
}

export function wrapStorageError(error: unknown): StorageError {
  if (error instanceof StorageError) return error;

  console.error('Unhandled storage error:', error);
  return new StorageError();
}
