import { describe, expect, test } from 'bun:test';
import { StatsService } from './StatsService.service';
import { createMockStatsRepository } from '../test/helpers/mocks';
import { ServiceError } from '../errors';

describe('StatsService', () => {
  test('getStats maps repository data and storage tier limits', async () => {
    const recentFiles = [
      {
        id: 'f1',
        name: 'doc.pdf',
        mimeType: 'application/pdf',
        size: 100,
        folderId: null,
        createdAt: new Date('2025-06-01'),
      },
    ];

    const service = new StatsService(
      createMockStatsRepository({
        countFilesByUserId: async () => 3,
        countFoldersByUserId: async () => 2,
        sumFileBytesByUserId: async () => 4096,
        findRecentFilesByUserId: async () => recentFiles,
        getUserStorageTier: async () => 'plus',
      }),
    );

    const stats = await service.getStats('user-1');

    expect(stats).toEqual({
      totalFiles: 3,
      totalFolders: 2,
      usedBytes: 4096,
      maxBytes: 5 * 1024 * 1024 * 1024,
      storageTier: 'plus',
      recentFiles,
    });
  });

  test('listStorageTiers excludes the free plan', () => {
    const service = new StatsService(createMockStatsRepository());
    expect(service.listStorageTiers().every((tier) => tier.id !== 'free')).toBe(true);
  });

  test('upgradeStorage rejects free tier', async () => {
    const service = new StatsService(createMockStatsRepository());
    await expect(service.upgradeStorage('user-1', 'free')).rejects.toThrow(
      'paid storage plan',
    );
  });

  test('upgradeStorage rejects downgrades', async () => {
    const service = new StatsService(
      createMockStatsRepository({
        getUserStorageTier: async () => 'pro',
      }),
    );

    await expect(service.upgradeStorage('user-1', 'plus')).rejects.toThrow('larger plan');
  });

  test('upgradeStorage updates tier and returns refreshed stats', async () => {
    let storedTier = 'free';

    const service = new StatsService(
      createMockStatsRepository({
        countFilesByUserId: async () => 1,
        countFoldersByUserId: async () => 0,
        sumFileBytesByUserId: async () => 50,
        findRecentFilesByUserId: async () => [],
        getUserStorageTier: async () => storedTier,
        updateUserStorageTier: async (_userId, tierId) => {
          storedTier = tierId;
        },
      }),
    );

    const stats = await service.upgradeStorage('user-1', 'plus');

    expect(storedTier).toBe('plus');
    expect(stats.storageTier).toBe('plus');
    expect(stats.maxBytes).toBe(5 * 1024 * 1024 * 1024);
  });

  test('upgradeStorage returns current stats when tier is unchanged', async () => {
    const service = new StatsService(
      createMockStatsRepository({
        getUserStorageTier: async () => 'plus',
        countFilesByUserId: async () => 0,
        countFoldersByUserId: async () => 0,
        sumFileBytesByUserId: async () => 0,
        findRecentFilesByUserId: async () => [],
        updateUserStorageTier: async () => {
          throw new ServiceError(500, 'should not update');
        },
      }),
    );

    const stats = await service.upgradeStorage('user-1', 'plus');
    expect(stats.storageTier).toBe('plus');
  });
});
