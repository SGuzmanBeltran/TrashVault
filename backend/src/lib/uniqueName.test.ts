import { describe, expect, test } from 'bun:test';
import { uniqueFileName } from './uniqueName';

describe('uniqueFileName', () => {
  test('returns original name when not taken', () => {
    expect(uniqueFileName('report.pdf', [])).toBe('report.pdf');
    expect(uniqueFileName('report.pdf', ['other.txt'])).toBe('report.pdf');
  });

  test('appends (n) before extension when name is taken', () => {
    const taken = ['photo.jpg'];
    expect(uniqueFileName('photo.jpg', taken)).toBe('photo (1).jpg');
    expect(uniqueFileName('photo.jpg', [...taken, 'photo (1).jpg'])).toBe('photo (2).jpg');
  });

  test('handles names without extension', () => {
    expect(uniqueFileName('README', ['README'])).toBe('README (1)');
  });

  test('does not treat leading dot as extension', () => {
    expect(uniqueFileName('.env', ['.env'])).toBe('.env (1)');
  });
});
