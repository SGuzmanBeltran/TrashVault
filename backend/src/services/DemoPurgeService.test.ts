import { describe, expect, test } from 'bun:test';
import { DemoPurgeService } from './DemoPurgeService.service';
import {
  createMockFileRepository,
  createMockFolderRepository,
  createMockStorage,
  makeFile,
  makeFolder,
} from '../test/helpers/mocks';

describe('DemoPurgeService', () => {
  test('purgeAllContent deletes storage keys and repository rows', async () => {
    const file = makeFile({
      id: 'f1',
      key: 'files/a',
      thumbnailKey: 'thumbnails/a',
    });
    const folder = makeFolder({ id: 'd1' });
    const deletedKeys: string[] = [];
    let deletedFileIds: string[] = [];
    let deletedFolderIds: string[] = [];

    const service = new DemoPurgeService(
      createMockFileRepository({
        findAll: async () => [file],
        deleteMany: async (ids) => {
          deletedFileIds = ids;
        },
      }),
      createMockFolderRepository({
        findAll: async () => [folder],
        deleteMany: async (ids) => {
          deletedFolderIds = ids;
        },
      }),
      createMockStorage({
        delete: async (key) => {
          deletedKeys.push(key);
        },
      }),
    );

    const result = await service.purgeAllContent(null);

    expect(result).toEqual({ filesDeleted: 1, foldersDeleted: 1 });
    expect(deletedFileIds).toEqual(['f1']);
    expect(deletedFolderIds).toEqual(['d1']);
    expect(deletedKeys.sort()).toEqual(['files/a', 'thumbnails/a']);
  });
});
