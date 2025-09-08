
import { getDailyAdjusted, extractCloses } from '../providers/alphaVantage';
import { annualizedHV, maxDrawdown, momentum, rsi, sma } from '../metrics/indicators';
import { getFundamentals, deriveQualityMetrics } from '../providers/fundamentals';
import { scoreCandidate, EquityMetrics } from '../metrics/scoring';
import { config } from '../config';

export async function runEquityScreen(env: any, symbols: string[]): Promise<{
  results: any[];
  diagnostics: { symbol: string; reason: string }[];
}> {
  const out: any[] = [];
  const diagnostics: { symbol: string; reason: string }[] = [];
  for (const symbol of symbols) {
    try {
      const json = await getDailyAdjusted(env, symbol);
      const closes = extractCloses(json);
      if (closes.length < 220) {
        const reason = 'insufficient price history';
        console.log(`${symbol} rejected: ${reason}`);
        diagnostics.push({ symbol, reason });
        continue;
      }
      const price = closes[closes.length - 1];
      const sma50 = sma(closes, 50)[closes.length - 1];
      const sma200Arr = sma(closes, 200);
      const sma200 = sma200Arr[closes.length - 1];
      const sma200Prev = sma200Arr[closes.length - 6]; // ~1 week slope approximation
      const sma200Slope = sma200 - sma200Prev;
      const rsi14 = rsi(closes, 14)[closes.length - 1];
      const hv = annualizedHV(closes, 60)[closes.length - 1];
      const mdd1y = maxDrawdown(closes, 252);
      const mom12m2m = momentum(closes);

      // Baseline filters
      if (!(price > sma200)) {
        const reason = `price ${price.toFixed(2)} <= SMA200 ${sma200.toFixed(2)}`;
        console.log(`${symbol} rejected: ${reason}`);
        diagnostics.push({ symbol, reason });
        continue;
      }
      if (!(sma200Slope > 0)) {
        const reason = 'SMA200 slope not positive';
        console.log(`${symbol} rejected: ${reason}`);
        diagnostics.push({ symbol, reason });
        continue;
      }
      if (!(rsi14 >= config.thresholds.rsiMin && rsi14 <= config.thresholds.rsiMax)) {
        const reason = `RSI14 ${rsi14.toFixed(2)} outside [${config.thresholds.rsiMin}, ${config.thresholds.rsiMax}]`;
        console.log(`${symbol} rejected: ${reason}`);
        diagnostics.push({ symbol, reason });
        continue;
      }
      if (!(mdd1y >= config.thresholds.maxDrawdown)) {
        const reason = `max drawdown ${mdd1y.toFixed(2)} < ${config.thresholds.maxDrawdown}`;
        console.log(`${symbol} rejected: ${reason}`);
        diagnostics.push({ symbol, reason });
        continue;
      }

      // Fundamentals (optional)
      const funda = await getFundamentals(env, symbol);
      const q = deriveQualityMetrics(funda);

      const eq: EquityMetrics = {
        symbol,
        price,
        sma50,
        sma200,
        sma200Slope,
        rsi14,
        hv60: hv ?? 0.4,
        mdd1y,
        mom12m2m,
        revCagr3y: q.revCagr3y,
        fcfPositive: q.fcfPositive,
        netDebtToEbitda: q.netDebtToEbitda,
        marginTrendOk: q.marginTrendOk,
      };
      const score = scoreCandidate(eq);
      const pass = score >= config.thresholds.passScore;
      out.push({ symbol, score, price, metrics: eq, pass });
    } catch (e) {
      console.log(`equityScreen error for ${symbol}:`, (e as Error).message);
      throw e;
    }
  }
  // Sort by score desc
  out.sort((a, b) => b.score - a.score);
  return { results: out, diagnostics };
}
