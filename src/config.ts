
export const config = {
  // Fallback symbols if top volume lookup fails
  universe: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'],
  topVolumeCount: 20,
  weights: {
    trend: 30,
    momentum: 20,
    volRisk: 20,
    quality: 20,
    options: 10,
  },
  thresholds: {
    passScore: 70,
    maxDrawdown: -0.30, // -30%
    rsiMin: 40,
    rsiMax: 65,
    ivrMax: 0.50,
    minOI: 500,
    maxSpreadPct: 0.05,
    targetDeltaMin: 0.6,
    targetDeltaMax: 0.8,
  },
};
