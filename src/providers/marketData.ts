import { cachedGetJSON } from '../store/kvCache';

export async function getTopVolumeSymbols(env: any, count = 20): Promise<string[]> {
  if (!env.FMP_KEY) return [];
  const key = env.FMP_KEY;
  const url = `https://site.financialmodelingprep.com/api/v3/stock_market/actives?apikey=${key}`;
  const cacheKey = `fmp:actives`;
  try {
    const data = await cachedGetJSON(env.leapspicker, cacheKey, 15 * 60, async () => {
      const res = await fetch(url, { cf: { cacheTtl: 0 } });
      if (!res.ok) throw new Error(`FMP actives error ${res.status}`);
      return res.json();
    });
    return (data as any[]).slice(0, count).map((r) => r.symbol as string);
  } catch {
    return [];
  }
}
