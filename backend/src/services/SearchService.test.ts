import { describe, expect, test } from 'bun:test';
import { SearchService } from './SearchService.service';
import {
  createMockFileRepository,
  createMockFolderRepository,
  makeFile,
  makeFolder,
} from '../test/helpers/mocks';

describe('SearchService', () => {
  test('returns empty results for blank query', async () => {
    const service = new SearchService(
      createMockFileRepository(),
      createMockFolderRepository(),
    );

    expect(await service.search('user-1', '   ')).toEqual({ files: [], folders: [] });
  });

  test('builds folder paths for matched items', async () => {
    const root = makeFolder({ id: 'root', name: 'Work', parentId: null });
    const nested = makeFolder({ id: 'nested', name: 'Invoices', parentId: 'root' });
    const file = makeFile({ id: 'f1', name: 'invoice.pdf', folderId: 'nested' });

    const service = new SearchService(
      createMockFileRepository({
        searchByName: async () => [file],
      }),
      createMockFolderRepository({
        searchByName: async () => [nested],
        findAllActiveByUserId: async () => [root, nested],
      }),
    );

    const results = await service.search('user-1', 'invoice');

    expect(results.files[0]?.path).toBe('My Files / Work / Invoices');
    expect(results.folders[0]?.path).toBe('My Files / Work');
  });

  test('stops on folder cycles when building paths', async () => {
    const a = makeFolder({ id: 'a', name: 'A', parentId: 'b' });
    const b = makeFolder({ id: 'b', name: 'B', parentId: 'a' });
    const file = makeFile({ folderId: 'a' });

    const service = new SearchService(
      createMockFileRepository({
        searchByName: async () => [file],
      }),
      createMockFolderRepository({
        searchByName: async () => [],
        findAllActiveByUserId: async () => [a, b],
      }),
    );

    const results = await service.search('user-1', 'doc');
    expect(results.files[0]?.path).toContain('My Files');
  });
});
