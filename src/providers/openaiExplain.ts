
/**
 * Optional: use the OpenAI API to generate a concise, risk-aware rationale for each pick.
 * Falls back to a templated explanation if OPENAI_API_KEY is not set.
 */

type Result = {
  symbol: string;
  score: number;
  price: number;
  metrics: any;
  options?: any;
  rationale?: string;
};

export async function explainWithGPT(env: any, results: Result[]): Promise<Result[]> {
  if (!env.OPENAI_API_KEY) {
    return results.map((r) => ({
      ...r,
      rationale:
        `Trend above long-term average with supportive momentum. ` +
        `Volatility and drawdown appear manageable. Options liquidity assumed OK (stub). ` +
        `Caution: verify IV rank and spreads before selecting LEAPS.`,
    }));
  }
  const explained: Result[] = [];
  for (const r of results) {
    try {
      const sys =
        "You are a buy-side analyst. Write a ~120-word, risk-aware rationale for a LEAPS entry. " +
        "Emphasize trend durability, growth/quality if present, volatility context, and an options liquidity note. " +
        "Include one caution. No hyperbole.";
      const user = JSON.stringify({
        symbol: r.symbol,
        score: r.score,
        metrics: r.metrics,
        options: r.options,
      });
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: `Explain this candidate: ${user}` },
          ],
          temperature: 0.3,
          max_tokens: 220,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
      const json: any = await res.json();
      const text = json.choices?.[0]?.message?.content ?? "";
      explained.push({ ...r, rationale: text });
    } catch {
      explained.push({
        ...r,
        rationale:
          "Good long-term trend and momentum with reasonable recent volatility. Verify IV rank and option liquidity before entry. Caution: avoid pre-earnings IV spikes.",
      });
    }
  }
  return explained;
}
