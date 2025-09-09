import { describe, expect, test } from 'vitest';
import { saveRun, loadLastRun } from '../src/store/runs';

// simple in-memory KV stub
function createKV() {
  return {
    store: {} as Record<string, string>,
    lastOpts: undefined as any,
    async get(key: string) {
      return this.store[key] ? JSON.parse(this.store[key]) : null;
    },
    async put(key: string, value: string, opts?: any) {
      this.store[key] = value;
      this.lastOpts = opts;
    },
  };
}

describe('runs store', () => {
  test('loadLastRun returns defaults when empty', async () => {
    const env = { leapspicker: createKV() };
    const data = await loadLastRun(env);
    expect(data).toEqual({ ts: null, results: [] });
  });

  test('saveRun persists without expiration', async () => {
    const kv = createKV();
    const env = { leapspicker: kv };
    const runData = { ts: 1, results: [1] };
    await saveRun(env, runData);
    expect(kv.lastOpts).toBeUndefined();
    const loaded = await loadLastRun(env);
    expect(loaded).toEqual(runData);
  });
});
