import { describe, expect, test } from 'bun:test';
import { sanitizeItemName } from './itemName';
import { ServiceError } from '../errors';

describe('sanitizeItemName', () => {
  test('trims whitespace', () => {
    expect(sanitizeItemName('  notes.txt  ')).toBe('notes.txt');
  });

  test('rejects empty names', () => {
    expect(() => sanitizeItemName('   ')).toThrow(ServiceError);
    expect(() => sanitizeItemName('   ')).toThrow('Name cannot be empty');
  });

  test('rejects path separators', () => {
    expect(() => sanitizeItemName('a/b')).toThrow('Name cannot contain / or \\');
    expect(() => sanitizeItemName('a\\b')).toThrow('Name cannot contain / or \\');
  });
});
