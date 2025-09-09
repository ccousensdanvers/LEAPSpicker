import { cachedGetJSON } from '../store/kvCache';

export async function getDailyAdjusted(env: any, symbol: string) {
  const key = env.ALPHA_VANTAGE_KEY;
  if (!key) throw new Error('ALPHA_VANTAGE_KEY not set');
  const premium = env.ALPHA_VANTAGE_PREMIUM === 'true' || env.ALPHA_VANTAGE_PREMIUM === '1';
  const outputsize = premium ? 'full' : 'compact';
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${key}&outputsize=${outputsize}`;
  const cacheKey = `av:daily:${symbol}:${outputsize}`;
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
