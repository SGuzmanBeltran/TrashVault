import { describe, expect, test } from 'bun:test';
import { FileService } from './FileService.service';
import { ThumbnailService } from './ThumbnailService.service';
import {
  createMockFileRepository,
  createMockFolderRepository,
  createMockStorage,
  makeFile,
  makeFolder,
} from '../test/helpers/mocks';
import { ConflictError, NotFoundError } from '../errors';

function createFileService(deps: {
  fileRepository?: ReturnType<typeof createMockFileRepository>;
  folderRepository?: ReturnType<typeof createMockFolderRepository>;
  storage?: ReturnType<typeof createMockStorage>;
}) {
  const storage = deps.storage ?? createMockStorage();
  const thumbnailService = new ThumbnailService(storage);
  return new FileService(
    deps.fileRepository ?? createMockFileRepository(),
    deps.folderRepository ?? createMockFolderRepository(),
    storage,
    thumbnailService,
  );
}

describe('FileService', () => {
  test('createFile rolls back storage when repository insert fails', async () => {
    const deletedKeys: string[] = [];
    const service = createFileService({
      fileRepository: createMockFileRepository({
        create: async () => {
          throw Object.assign(new Error('db down'), { code: '99999' });
        },
      }),
      storage: createMockStorage({
        upload: async () => {},
        delete: async (key) => {
          deletedKeys.push(key);
        },
      }),
    });

    await expect(
      service.createFile({
        id: 'new-file',
        userId: 'user-1',
        name: 'a.txt',
        mimeType: 'text/plain',
        size: 10,
        bucket: 'bucket',
        key: 'files/a.txt',
        folderId: null,
        buffer: new ArrayBuffer(10),
        thumbnail: null,
      }),
    ).rejects.toThrow();

    expect(deletedKeys).toEqual(['files/a.txt']);
  });

  test('renameFile rejects duplicate names in the same folder', async () => {
    const file = makeFile({ id: 'a', name: 'old.txt', folderId: 'folder-1' });
    const sibling = makeFile({ id: 'b', name: 'taken.txt', folderId: 'folder-1' });

    const service = createFileService({
      fileRepository: createMockFileRepository({
        findById: async () => file,
        findByUserId: async () => [file, sibling],
      }),
    });

    await expect(service.renameFile('a', 'user-1', 'taken.txt')).rejects.toThrow(ConflictError);
  });

  test('renameFile returns unchanged file when name is the same', async () => {
    const file = makeFile({ name: 'same.txt' });
    const service = createFileService({
      fileRepository: createMockFileRepository({
        findById: async () => file,
        findByUserId: async () => [file],
      }),
    });

    const result = await service.renameFile('file-1', 'user-1', '  same.txt  ');
    expect(result).toBe(file);
  });

  test('moveFile requires existing destination folder', async () => {
    const file = makeFile({ folderId: null });
    const service = createFileService({
      fileRepository: createMockFileRepository({
        findById: async () => file,
      }),
      folderRepository: createMockFolderRepository({
        findById: async () => null,
      }),
    });

    await expect(service.moveFile('file-1', 'user-1', 'missing-folder')).rejects.toThrow(
      NotFoundError,
    );
  });

  test('moveFile updates folder when destination exists', async () => {
    const file = makeFile({ id: 'file-1', folderId: null });
    const dest = makeFolder({ id: 'dest' });
    const updated = makeFile({ id: 'file-1', folderId: 'dest' });

    const service = createFileService({
      fileRepository: createMockFileRepository({
        findById: async () => file,
        updateFolderId: async () => updated,
      }),
      folderRepository: createMockFolderRepository({
        findById: async () => dest,
      }),
    });

    expect(await service.moveFile('file-1', 'user-1', 'dest')).toEqual(updated);
  });

  test('getDownloadUrl returns signed url for existing file', async () => {
    const file = makeFile({ key: 'files/doc.pdf' });
    const service = createFileService({
      fileRepository: createMockFileRepository({
        findById: async () => file,
      }),
    });

    const url = await service.getDownloadUrl('file-1', 'user-1');
    expect(url).toBe('https://signed.example/files/doc.pdf');
  });
});
