
import { cachedGetJSON } from '../store/kvCache';

export async function getDailyAdjusted(env: any, symbol: string) {
  const key = env.ALPHA_VANTAGE_KEY;
  if (!key) throw new Error('ALPHA_VANTAGE_KEY not set');
  // We need at least 200+ bars for the long-term indicators (e.g. SMA200).
  // Alpha Vantage's "compact" output only returns ~100 days which causes the
  // equity screen to discard symbols due to insufficient history. Request the
  // "full" dataset instead and cache it under a distinct key so previously
  // cached compact results don't get reused.
  const url =
    `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}` +
    `&apikey=${key}&outputsize=full`;
  const cacheKey = `av:daily:${symbol}:full`;
  return cachedGetJSON(env.leapspicker, cacheKey, 24 * 60 * 60, async () => {
    const res = await fetch(url, { cf: { cacheTtl: 0 } });
    if (!res.ok) throw new Error(`Alpha Vantage error ${res.status}`);
    const json = await res.json();
    return json;
  });
}

export function extractCloses(avJson: any): number[] {
  const ts = avJson['Time Series (Daily)'];
  if (!ts) return [];
  const rows = Object.entries(ts).map(([d, o]: any) => ({
    d,
    c: +o['5. adjusted close'],
  }));
  rows.sort((a, b) => (a.d < b.d ? -1 : 1));
  return rows.map((r) => r.c);
}
