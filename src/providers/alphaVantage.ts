
import { cachedGetJSON } from '../store/kvCache';

export async function getDailyAdjusted(env: any, symbol: string) {
  const key = env.ALPHA_VANTAGE_KEY;
  if (!key) throw new Error('ALPHA_VANTAGE_KEY not set');
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${key}&outputsize=compact`;
  const cacheKey = `av:daily:${symbol}`;
  return cachedGetJSON(env.leapspicker, cacheKey, 24 * 60 * 60, async () => {
    const res = await fetch(url, { cf: { cacheTtl: 0 } });
    if (!res.ok) throw new Error(`Alpha Vantage error ${res.status}`);
    const json = await res.json();
    return json;
  });
}

export async function getIntradayRealtime(env: any, symbol: string, interval = '5min') {
  const key = env.ALPHA_VANTAGE_KEY;
  if (!key) throw new Error('ALPHA_VANTAGE_KEY not set');
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&entitlement=realtime&apikey=${key}`;
  const cacheKey = `av:intraday:${symbol}:${interval}`;
  return cachedGetJSON(env.leapspicker, cacheKey, 60, async () => {
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

export function extractIntradayLatest(avJson: any, interval: string): number | null {
  const ts = avJson[`Time Series (${interval})`];
  if (!ts) return null;
  const latestKey = Object.keys(ts).sort().pop();
  if (!latestKey) return null;
  return +ts[latestKey]['4. close'];
}
