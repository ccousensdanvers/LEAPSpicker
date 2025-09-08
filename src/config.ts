export const config = {
  universe: ['NVDA', 'AMD', 'TSLA', 'AAPL', 'MSFT', 'GOOG', 'AMZN', 'META', 'PLTR', 'NEE'],
  weights: {
    trend: 30,
    momentum: 20,
    volRisk: 20,
    quality: 20,
    options: 10,
  },
  thresholds: {
    passScore: 70,
    maxDrawdown: -0.3, // -30%
    rsiMin: 40,
    rsiMax: 65,
    ivrMax: 0.5,
    minOI: 500,
    maxSpreadPct: 0.05,
    targetDeltaMin: 0.6,
    targetDeltaMax: 0.8,
  },
};
