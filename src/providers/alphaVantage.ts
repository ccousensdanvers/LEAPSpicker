
import { cachedGetJSON } from '../store/kvCache';

export type AlphaVantageResult<T = any> =
  | { type: 'success'; data: T }
  | { type: 'error'; message: string };

export async function getDailyAdjusted(env: any, symbol: string): Promise<AlphaVantageResult> {
  const key = env.ALPHA_VANTAGE_KEY;
  if (!key) throw new Error('ALPHA_VANTAGE_KEY not set');
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${key}&outputsize=compact`;
  const cacheKey = `av:daily:${symbol}`;
  return cachedGetJSON(env.leapspicker, cacheKey, 24 * 60 * 60, async () => {
    const res = await fetch(url, { cf: { cacheTtl: 0 } });
    if (!res.ok) {
      return { type: 'error', message: `Alpha Vantage error ${res.status}` };
    }
    const json: any = await res.json();
    const softError = json['Error Message'] || json['Information'] || json['Note'];
    if (softError) {
      return { type: 'error', message: softError };
    }
    return { type: 'success', data: json };
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
