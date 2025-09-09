
import { getJSON, putJSON } from './kvCache';

const LAST_RUN_KEY = 'runs:last';

export async function saveRun(env: any, data: any) {
  // store the latest run indefinitely so the dashboard always has data
  await putJSON(env.leapspicker, LAST_RUN_KEY, data);
}

export async function loadLastRun(env: any) {
  const val = await getJSON(env.leapspicker, LAST_RUN_KEY);
  return val ?? { ts: null, results: [] };
}
