export interface DemoPurgeConfig {
  enabled: boolean;
  intervalMs: number;
  maxAgeMs: number | null;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getDemoPurgeConfig(): DemoPurgeConfig {
  const enabled = process.env.DEMO_AUTO_PURGE === 'true';
  const intervalMs = parsePositiveInt(process.env.DEMO_PURGE_INTERVAL_MS, 60 * 60 * 1000);
  const maxAgeRaw = process.env.DEMO_PURGE_MAX_AGE_MS;
  const maxAgeMs = maxAgeRaw ? parsePositiveInt(maxAgeRaw, 0) || null : null;

  return {
    enabled,
    intervalMs,
    maxAgeMs,
  };
}
