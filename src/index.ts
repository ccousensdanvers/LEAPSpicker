
import { runEquityScreen } from './screens/equityScreen';
import { optionsFeasibility } from './screens/optionsFilter';
import { renderHTML } from './ui/html';
import { renderJSON } from './ui/json';
import { explainWithGPT } from './providers/openaiExplain';
import { saveRun, loadLastRun } from './store/runs';
import { getQueryParamList } from './utils/dates';
import { config } from './config';

export interface Env {
  leapspicker?: KVNamespace;
  ALPHA_VANTAGE_KEY?: string;
  FMP_KEY?: string;
  OPENAI_API_KEY?: string;
  OPTIONS_API_KEY?: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (!env.leapspicker) {
      console.error('KV binding "leapspicker" is undefined');
      return new Response('KV binding not configured', { status: 500 });
    }
    const url = new URL(req.url);
    if (url.pathname === '/') return new Response('ok');
    if (url.pathname === '/picks.json') {
      const last = await loadLastRun(env);
      return new Response(renderJSON(last), { headers: { 'content-type': 'application/json' } });
    }
    if (url.pathname === '/picks') {
      const last = await loadLastRun(env);
      return new Response(renderHTML(last), { headers: { 'content-type': 'text/html' } });
    }
    if (url.pathname === '/run') {
      const symbols = getQueryParamList(url, 'symbols') ?? config.universe;
      const equity = await runEquityScreen(env, symbols);
      const afterOptions = await optionsFeasibility(env, equity);
      const withExplainers = await explainWithGPT(env, afterOptions);
      const stamped = { ts: new Date().toISOString(), results: withExplainers };
      await saveRun(env, stamped);
      return new Response(renderJSON(stamped), { headers: { 'content-type': 'application/json' } });
    }
    return new Response('Not found', { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    if (!env.leapspicker) {
      console.error('KV binding "leapspicker" is undefined');
      return;
    }
    const symbols = config.universe;
    const equity = await runEquityScreen(env, symbols);
    const afterOptions = await optionsFeasibility(env, equity);
    const withExplainers = await explainWithGPT(env, afterOptions);
    const stamped = { ts: new Date().toISOString(), results: withExplainers };
    await saveRun(env, stamped);
  },
};
