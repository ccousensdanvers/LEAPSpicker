
import { basicOptionsChecks, StubOptionsProvider } from '../providers/optionsProvider';
import { scoreCandidate } from '../metrics/scoring';
import { config } from '../config';

export async function optionsFeasibility(env: any, equityResults: any[]) {
  const provider = new StubOptionsProvider();
  const out: any[] = [];
  for (const r of equityResults) {
    try {
      // In stub mode we don't actually fetch a chain; integrate real provider later.
      const checks = basicOptionsChecks([]);
      const score = scoreCandidate(r.metrics, checks);
      const pass = r.pass && score >= config.thresholds.passScore;
      out.push({ ...r, score, options: checks, pass });
    } catch (e) {
      console.log('optionsFilter error:', (e as Error).message);
      out.push({
        ...r,
        options: { ivRank: undefined, oiOk: true, spreadOk: true, targetDeltaOk: true },
        pass: false,
      });
    }
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}
