import { afterEach, describe, expect, test } from 'bun:test';
import { getDemoPurgeConfig } from './demoConfig';

const ENV_KEYS = ['DEMO_AUTO_PURGE', 'DEMO_PURGE_INTERVAL_MS', 'DEMO_PURGE_MAX_AGE_MS'] as const;

function saveEnv(): Record<string, string | undefined> {
  return Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
}

function restoreEnv(snapshot: Record<string, string | undefined>): void {
  for (const key of ENV_KEYS) {
    const value = snapshot[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe('getDemoPurgeConfig', () => {
  let envSnapshot: Record<string, string | undefined>;

  afterEach(() => {
    restoreEnv(envSnapshot);
  });

  test('uses defaults when env vars are missing', () => {
    envSnapshot = saveEnv();
    for (const key of ENV_KEYS) delete process.env[key];

    expect(getDemoPurgeConfig()).toEqual({
      enabled: false,
      intervalMs: 60 * 60 * 1000,
      maxAgeMs: null,
    });
  });

  test('parses enabled flag and custom intervals', () => {
    envSnapshot = saveEnv();
    process.env.DEMO_AUTO_PURGE = 'true';
    process.env.DEMO_PURGE_INTERVAL_MS = '120000';
    process.env.DEMO_PURGE_MAX_AGE_MS = '3600000';

    expect(getDemoPurgeConfig()).toEqual({
      enabled: true,
      intervalMs: 120000,
      maxAgeMs: 3600000,
    });
  });

  test('falls back for invalid numeric values', () => {
    envSnapshot = saveEnv();
    process.env.DEMO_PURGE_INTERVAL_MS = 'not-a-number';

    expect(getDemoPurgeConfig().intervalMs).toBe(60 * 60 * 1000);
  });
});
