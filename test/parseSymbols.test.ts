import { describe, it, expect } from 'vitest';
import { parseSymbols } from '../src/utils/symbols';

describe('parseSymbols', () => {
  it('parses various delimiters and encodings', () => {
    const url = new URL('https://x/run?symbols=AAPL, msft;googl%0Ameta+tsla%20amzn');
    expect(parseSymbols(url)).toEqual(['AAPL', 'MSFT', 'GOOGL', 'META', 'TSLA', 'AMZN']);
  });

  it('dedupes and filters invalid tickers', () => {
    const url = new URL('https://x/run?symbols=AAPL,,123,GOOG,AAPL');
    expect(parseSymbols(url)).toEqual(['AAPL', 'GOOG']);
  });
});
