
/**
 * Optional: use the OpenAI API to generate a concise, risk-aware rationale for each pick.
 * Falls back to a templated explanation if OPENAI_API_KEY is not set.
 */

import { config } from '../config';

type Result = {
  symbol: string;
  score: number;
  price: number;
  metrics: any;
  options?: any;
  rationale?: string;
};

const thresholds = config.thresholds;

function gateFlags(r: Result) {
  const priceAboveSMA200 = r.price > r.metrics.sma200 ? 'above' : 'below';
  const rsiBand =
    r.metrics.rsi14 >= thresholds.rsiMin && r.metrics.rsi14 <= thresholds.rsiMax
      ? 'within band'
      : 'outside band';
  const drawdownOK =
    r.metrics.mdd1y >= thresholds.maxDrawdown ? 'OK' : 'too deep';
  return { priceAboveSMA200, rsiBand, drawdownOK };
}

function buildPrompt(r: Result) {
  const { priceAboveSMA200, rsiBand, drawdownOK } = gateFlags(r);
  return `Explain why ${r.symbol} scored ${Math.round(r.score)}/100.
- Price vs SMA200: ${r.price.toFixed(2)} vs ${r.metrics.sma200.toFixed(2)} → ${priceAboveSMA200}
- SMA200 slope: ${r.metrics.sma200Slope.toFixed(2)}
- RSI: ${r.metrics.rsi14.toFixed(2)} (target band ${thresholds.rsiMin}–${thresholds.rsiMax}) → ${rsiBand}
- Max drawdown: ${(r.metrics.mdd1y * 100).toFixed(1)}% (threshold ${(thresholds.maxDrawdown * 100).toFixed(0)}%) → ${drawdownOK}
Give a concise investment rationale for LEAPS suitability.`;
}

function fallbackRationale(r: Result) {
  const { priceAboveSMA200, rsiBand, drawdownOK } = gateFlags(r);
  return (
    `Price vs SMA200: ${r.price.toFixed(2)} vs ${r.metrics.sma200.toFixed(2)} → ${priceAboveSMA200}. ` +
    `SMA200 slope: ${r.metrics.sma200Slope.toFixed(2)}. ` +
    `RSI: ${r.metrics.rsi14.toFixed(2)} (target band ${thresholds.rsiMin}–${thresholds.rsiMax}) → ${rsiBand}. ` +
    `Max drawdown: ${(r.metrics.mdd1y * 100).toFixed(1)}% (threshold ${(thresholds.maxDrawdown * 100).toFixed(0)}%) → ${drawdownOK}. ` +
    `Options liquidity assumed OK (stub). Verify IV rank and spreads before selecting LEAPS.`
  );
}

export async function explainWithGPT(env: any, results: Result[]): Promise<Result[]> {
  if (!env.OPENAI_API_KEY) {
    return results.map((r) => ({ ...r, rationale: fallbackRationale(r) }));
  }
  const explained: Result[] = [];
  for (const r of results) {
    try {
      const sys =
        'You are a buy-side analyst. Write a ~120-word, risk-aware rationale for a LEAPS entry. ' +
        'Emphasize trend durability, growth/quality if present, volatility context, and an options liquidity note. ' +
        'Include one caution. No hyperbole.';
      const user = buildPrompt(r);
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: user },
          ],
          temperature: 0.3,
          max_tokens: 220,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
      const json: any = await res.json();
      const text = json.choices?.[0]?.message?.content ?? '';
      explained.push({ ...r, rationale: text });
    } catch {
      explained.push({ ...r, rationale: fallbackRationale(r) });
    }
  }
  return explained;
}

