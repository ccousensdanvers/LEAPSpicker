import { describe, it, expect, vi } from 'vitest';
import { saveRun, loadLastRun } from '../src/store/runs';

function mockKV() {
  const store = new Map<string, string>();
  return {
    put: vi.fn(async (key: string, value: string, _opts?: any) => {
      store.set(key, value);
    }),
    get: vi.fn(async (key: string, opts?: any) => {
      const val = store.get(key);
      if (val == null) return null;
      return opts?.type === 'json' ? JSON.parse(val) : val;
    }),
  } as unknown as KVNamespace;
}

describe('run persistence', () => {
  it('saves and loads the last run', async () => {
    const kv = mockKV();
    const env = { leapspicker: kv };
    const data = { ts: 'now', results: [{ x: 1 }] };

    await saveRun(env, data);
    expect((kv.put as any).mock.calls[0][0]).toBe('runs:last');

    const loaded = await loadLastRun(env);
    expect(loaded).toEqual(data);
  });
});

