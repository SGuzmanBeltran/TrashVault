import type { DemoPurgeConfig } from '../lib/demoConfig';
import { createDemoPurgeService } from './di/container';

export function startDemoPurgeScheduler(config: DemoPurgeConfig): void {
  if (!config.enabled) return;

  const purgeService = createDemoPurgeService();
  let running = false;

  async function runPurge(): Promise<void> {
    if (running) return;
    running = true;

    try {
      const result = await purgeService.purgeAllContent(config.maxAgeMs);
      if (result.filesDeleted > 0 || result.foldersDeleted > 0) {
        console.log(
          `[demo-purge] Removed ${result.filesDeleted} file(s) and ${result.foldersDeleted} folder(s) across all users`,
        );
      }
    } catch (error) {
      console.error('[demo-purge] Failed:', error);
    } finally {
      running = false;
    }
  }

  const intervalHours = (config.intervalMs / (60 * 60 * 1000)).toFixed(1);
  const ageLabel = config.maxAgeMs
    ? `older than ${(config.maxAgeMs / (60 * 60 * 1000)).toFixed(1)}h`
    : 'all content';
  console.log(
    `[demo-purge] Enabled — purging ${ageLabel} for all users every ${intervalHours}h`,
  );

  setInterval(() => {
    void runPurge();
  }, config.intervalMs);
}
