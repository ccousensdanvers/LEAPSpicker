
import { cachedGetJSON } from '../store/kvCache';

let keyIdx = 0;
function nextKey(env: any): string {
  const raw = env.ALPHA_VANTAGE_KEYS || env.ALPHA_VANTAGE_KEY;
  const keys = typeof raw === 'string' ? raw.split(',').map((k) => k.trim()).filter(Boolean) : [];
  if (keys.length === 0) throw new Error('ALPHA_VANTAGE_KEY not set');
  const k = keys[keyIdx % keys.length];
  keyIdx += 1;
  return k;
}

export async function getDailyAdjusted(env: any, symbol: string) {
  const key = nextKey(env);
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${key}&outputsize=compact`;
  const cacheKey = `av:daily:${symbol}`;
  return cachedGetJSON(env.leapspicker, cacheKey, 24 * 60 * 60, async () => {
    const res = await fetch(url, { cf: { cacheTtl: 3600 } });
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
