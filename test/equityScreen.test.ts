import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/providers/alphaVantage', () => ({
  getDailyAdjusted: vi.fn((_env, symbol: string) => symbol),
  extractCloses: (symbol: string) => {
    if (symbol === 'GOOD') return Array.from({ length: 220 }, (_, i) => i + 1);
    return Array(220).fill(50);
  },
}));

vi.mock('../src/metrics/indicators', () => ({
  sma: (closes: number[], _n: number) => closes.map((_, i) => i),
  rsi: () => Array(220).fill(50),
  annualizedHV: () => Array(220).fill(0.2),
  maxDrawdown: () => -0.1,
  momentum: () => 0.1,
}));

vi.mock('../src/providers/fundamentals', () => ({
  getFundamentals: vi.fn(),
  deriveQualityMetrics: () => ({
    revCagr3y: 0.1,
    fcfPositive: true,
    netDebtToEbitda: 1,
    marginTrendOk: true,
  }),
}));

vi.mock('../src/metrics/scoring', () => ({
  scoreCandidate: (eq: any) => (eq.symbol === 'GOOD' ? 80 : 10),
}));

describe('runEquityScreen', () => {
  it('returns all symbols with pass flag', async () => {
    const { runEquityScreen } = await import('../src/screens/equityScreen');
    const res = await runEquityScreen({}, ['GOOD', 'BAD']);
    expect(res).toHaveLength(2);
    const good = res.find((r) => r.symbol === 'GOOD');
    const bad = res.find((r) => r.symbol === 'BAD');
    expect(good?.pass).toBe(true);
    expect(bad?.pass).toBe(false);
  });
});
