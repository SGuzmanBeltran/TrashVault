import { describe, expect, test } from 'bun:test';
import { ThumbnailService } from './ThumbnailService.service';
import { createMockStorage } from '../test/helpers/mocks';

describe('ThumbnailService', () => {
  const service = new ThumbnailService(createMockStorage());

  test('getThumbnailKey maps files path to thumbnails jpg', () => {
    expect(service.getThumbnailKey('files/user/photo.png')).toBe('thumbnails/user/photo.jpg');
    expect(service.getThumbnailKey('other/photo.png')).toBe('other/photo.jpg');
  });

  test('shouldGenerate returns true for supported image and video types', async () => {
    await expect(service.shouldGenerate('image/png')).resolves.toBe(true);
    await expect(service.shouldGenerate('video/mp4')).resolves.toBe(true);
    await expect(service.shouldGenerate('application/pdf')).resolves.toBe(false);
  });

  test('generateAndUpload returns null for unsupported mime types', async () => {
    const result = await service.generateAndUpload(new ArrayBuffer(8), 'text/plain', 'files/a.txt');
    expect(result).toBeNull();
  });
});
