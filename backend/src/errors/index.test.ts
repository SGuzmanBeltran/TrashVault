import { describe, expect, test, mock } from 'bun:test';
import {
  ConflictError,
  DatabaseError,
  NotFoundError,
  ServiceError,
  StorageError,
  wrapRepositoryError,
  wrapStorageError,
} from './index';

describe('ServiceError hierarchy', () => {
  test('sets status codes on subclasses', () => {
    expect(new NotFoundError().statusCode).toBe(404);
    expect(new ConflictError().statusCode).toBe(409);
    expect(new DatabaseError().statusCode).toBe(500);
    expect(new StorageError().statusCode).toBe(500);
  });

  test('preserves custom messages', () => {
    expect(new ServiceError(418, 'teapot').message).toBe('teapot');
  });
});

describe('wrapRepositoryError', () => {
  test('returns ServiceError unchanged', () => {
    const error = new ConflictError('duplicate');
    expect(wrapRepositoryError(error)).toBe(error);
  });

  test('maps unique violation to ConflictError', () => {
    const pgError = Object.assign(new Error('duplicate key'), { code: '23505' });
    expect(wrapRepositoryError(pgError)).toBeInstanceOf(ConflictError);
  });

  test('maps not-null and foreign-key violations to DatabaseError', () => {
    const notNull = Object.assign(new Error('not null'), { code: '23502' });
    const foreignKey = Object.assign(new Error('fk'), { code: '23503' });

    expect(wrapRepositoryError(notNull).message).toBe('Invalid data provided');
    expect(wrapRepositoryError(foreignKey).message).toBe('Invalid data provided');
  });

  test('wraps unknown errors as DatabaseError', () => {
    const log = mock(() => {});
    const original = console.error;
    console.error = log;

    try {
      const wrapped = wrapRepositoryError(new Error('boom'));
      expect(wrapped).toBeInstanceOf(DatabaseError);
      expect(log).toHaveBeenCalled();
    } finally {
      console.error = original;
    }
  });
});

describe('wrapStorageError', () => {
  test('returns StorageError unchanged', () => {
    const error = new StorageError('disk full');
    expect(wrapStorageError(error)).toBe(error);
  });

  test('wraps unknown errors as StorageError', () => {
    const log = mock(() => {});
    const original = console.error;
    console.error = log;

    try {
      const wrapped = wrapStorageError(new Error('network'));
      expect(wrapped).toBeInstanceOf(StorageError);
      expect(log).toHaveBeenCalled();
    } finally {
      console.error = original;
    }
  });
});
