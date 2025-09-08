import { describe, it, expect, vi } from 'vitest';
import { getIntradayRealtime, extractIntradayLatest } from '../src/providers/alphaVantage';

describe('alphaVantage provider', () => {
  it('requests intraday data with realtime entitlement', async () => {
    const fakeKV = { get: vi.fn().mockResolvedValue(null), put: vi.fn().mockResolvedValue(undefined) } as any;
    const env = { ALPHA_VANTAGE_KEY: 'demo', leapspicker: fakeKV };
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({}) } as any);
    await getIntradayRealtime(env, 'IBM');
    expect((fetch as any).mock.calls[0][0]).toMatch(/entitlement=realtime/);
  });

  it('extractIntradayLatest finds most recent close', () => {
    const sample = {
      'Time Series (5min)': {
        '2024-01-01 09:35:00': { '4. close': '150.00' },
        '2024-01-01 09:40:00': { '4. close': '151.00' },
      },
    };
    const price = extractIntradayLatest(sample, '5min');
    expect(price).toBe(151);
  });
});
