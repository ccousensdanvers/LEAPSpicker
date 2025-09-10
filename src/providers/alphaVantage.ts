import { cachedGetJSON } from '../store/kvCache';

export async function getDailyAdjusted(env: any, symbol: string) {
  const key = env.ALPHA_VANTAGE_KEY;
  if (!key) throw new Error('ALPHA_VANTAGE_KEY not set');
  const params = new URLSearchParams({
    function: 'TIME_SERIES_DAILY_ADJUSTED',
    symbol,
    apikey: key,
    outputsize: 'full',
  });
  const url = `https://www.alphavantage.co/query?${params.toString()}`;
  const cacheKey = `av:daily:${symbol}`;
  return cachedGetJSON(env.leapspicker, cacheKey, 24 * 60 * 60, async () => {
    const res = await fetch(url, { cf: { cacheTtl: 0 } });
    if (!res.ok) throw new Error(`Alpha Vantage error ${res.status}`);
    const json = await res.json();
    if (json.Note || json['Error Message']) {
      const msg = json.Note || json['Error Message'];
      throw new Error(`Alpha Vantage API error: ${msg}`);
    }
    return json;
  });
}

export function extractCloses(avJson: any): number[] {
  const ts = avJson['Time Series (Daily)'];
  if (!ts) throw new Error('Alpha Vantage response missing Time Series (Daily)');
  const rows = Object.entries(ts).map(([d, o]: any) => ({
    d,
    c: +o['5. adjusted close'],
  }));
  rows.sort((a, b) => (a.d < b.d ? -1 : 1));
  return rows.map((r) => r.c);
}
