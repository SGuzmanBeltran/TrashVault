import { describe, expect, test } from 'bun:test';
import { TrashService } from './TrashService.service';
import {
  createMockFileRepository,
  createMockFolderRepository,
  createMockStorage,
  makeFile,
  makeFolder,
} from '../test/helpers/mocks';

describe('TrashService', () => {
  test('getTrash returns trashed files and folders', async () => {
    const files = [makeFile({ trashedAt: new Date() })];
    const folders = [makeFolder({ trashedAt: new Date() })];

    const service = new TrashService(
      createMockFileRepository({ findTrashedByUserId: async () => files }),
      createMockFolderRepository({ findTrashedByUserId: async () => folders }),
      createMockStorage(),
    );

    expect(await service.getTrash('user-1')).toEqual({ files, folders });
  });

  test('restoreFolder restores descendant folders', async () => {
    const parent = makeFolder({ id: 'parent', parentId: null, trashedAt: new Date() });
    const child = makeFolder({ id: 'child', parentId: 'parent', trashedAt: new Date() });
    const restored: string[][] = [];

    const service = new TrashService(
      createMockFileRepository(),
      createMockFolderRepository({
        findTrashedByUserId: async () => [parent, child],
        restoreManyFromTrash: async (ids) => {
          restored.push([...ids]);
        },
      }),
      createMockStorage(),
    );

    await service.restoreFolder('parent', 'user-1');
    expect(restored[0]?.sort()).toEqual(['child', 'parent']);
  });

  test('emptyTrash dedupes files and deletes storage keys', async () => {
    const trashedFile = makeFile({
      id: 'dup',
      key: 'files/a',
      thumbnailKey: 'thumbnails/a',
      trashedAt: new Date(),
    });
    const activeDuplicate = makeFile({
      id: 'dup',
      key: 'files/a',
      thumbnailKey: 'thumbnails/a',
      trashedAt: null,
      folderId: 'folder-1',
    });
    const deletedKeys: string[] = [];

    const service = new TrashService(
      createMockFileRepository({
        findTrashedByUserId: async () => [trashedFile],
        findActiveByFolderIds: async () => [activeDuplicate],
        permanentDeleteMany: async (ids) => {
          expect(ids).toEqual(['dup']);
        },
      }),
      createMockFolderRepository({
        findTrashedByUserId: async () => [makeFolder({ id: 'folder-1' })],
        emptyTrash: async () => {},
      }),
      createMockStorage({
        delete: async (key) => {
          deletedKeys.push(key);
        },
      }),
    );

    await service.emptyTrash('user-1');
    expect(deletedKeys.sort()).toEqual(['files/a', 'thumbnails/a']);
  });
});
