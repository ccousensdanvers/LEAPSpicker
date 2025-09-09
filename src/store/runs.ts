
import { getJSON, putJSON } from './kvCache';

const LAST_RUN_KEY = 'runs:last';

export async function saveRun(env: any, data: any) {
  try {
    await putJSON(env.leapspicker, LAST_RUN_KEY, data, 7 * 24 * 60 * 60);
    return true;
  } catch (err) {
    console.error(`Failed to save run to ${LAST_RUN_KEY}:`, err);
    return false;
  }
}

export async function loadLastRun(env: any) {
  const val = await getJSON(env.leapspicker, LAST_RUN_KEY);
  return val ?? { ts: null, results: [] };
}
