import { describe, expect, test } from 'bun:test';
import { FolderService } from './FolderService.service';
import {
  createMockFileRepository,
  createMockFolderRepository,
  createMockStorage,
  makeFile,
  makeFolder,
} from '../test/helpers/mocks';
import { NotFoundError, ServiceError } from '../errors';

describe('FolderService', () => {
  test('moveFolder rejects moving into itself', async () => {
    const folder = makeFolder({ id: 'f1' });
    const service = new FolderService(
      createMockFolderRepository({ findById: async () => folder }),
      createMockFileRepository(),
      createMockStorage(),
    );

    await expect(service.moveFolder('f1', 'user-1', 'f1')).rejects.toThrow(ServiceError);
    await expect(service.moveFolder('f1', 'user-1', 'f1')).rejects.toThrow('into itself');
  });

  test('moveFolder rejects moving into a descendant', async () => {
    const parent = makeFolder({ id: 'parent', parentId: null });
    const child = makeFolder({ id: 'child', parentId: 'parent' });

    const service = new FolderService(
      createMockFolderRepository({
        findById: async (id) => {
          if (id === 'parent') return parent;
          if (id === 'child') return child;
          return null;
        },
        findByUserId: async (_userId, parentId) => {
          if (parentId === 'parent') return [child];
          return [];
        },
      }),
      createMockFileRepository(),
      createMockStorage(),
    );

    await expect(service.moveFolder('parent', 'user-1', 'child')).rejects.toThrow(
      'into its subfolder',
    );
  });

  test('renameFolder rejects duplicate sibling names', async () => {
    const folder = makeFolder({ id: 'a', name: 'Old', parentId: null });
    const sibling = makeFolder({ id: 'b', name: 'Taken', parentId: null });

    const service = new FolderService(
      createMockFolderRepository({
        findById: async () => folder,
        findByUserId: async () => [folder, sibling],
      }),
      createMockFileRepository(),
      createMockStorage(),
    );

    await expect(service.renameFolder('a', 'user-1', 'Taken')).rejects.toThrow(
      'folder with this name already exists',
    );
  });

  test('buildFolderZipBuffer includes manifest and file contents', async () => {
    const folder = makeFolder({ id: 'root', name: 'Exports' });
    const file = makeFile({
      id: 'file-1',
      name: 'readme.txt',
      folderId: 'root',
      key: 'files/readme.txt',
      mimeType: 'text/plain',
    });

    const service = new FolderService(
      createMockFolderRepository({
        findById: async () => folder,
        findByUserId: async () => [],
      }),
      createMockFileRepository({
        findByUserId: async () => [file],
      }),
      createMockStorage({
        download: async () => new TextEncoder().encode('hello').buffer,
      }),
    );

    const zip = await service.buildFolderZipBuffer('root', 'user-1');
    expect(zip.filename).toBe('Exports.zip');
    expect(zip.buffer.byteLength).toBeGreaterThan(0);
  });

  test('getFolder returns null when missing', async () => {
    const service = new FolderService(
      createMockFolderRepository(),
      createMockFileRepository(),
      createMockStorage(),
    );

    expect(await service.getFolder('missing', 'user-1')).toBeNull();
  });

  test('moveFolder throws when destination folder is missing', async () => {
    const folder = makeFolder({ id: 'src' });
    const service = new FolderService(
      createMockFolderRepository({
        findById: async (id) => (id === 'src' ? folder : null),
        findByUserId: async () => [],
      }),
      createMockFileRepository(),
      createMockStorage(),
    );

    await expect(service.moveFolder('src', 'user-1', 'dest')).rejects.toThrow(NotFoundError);
  });
});
