import type { IncomingMessage, ServerResponse } from 'node:http';

// Serverless functions are stateless across invocations.
// The dismiss endpoint simply acknowledges the request.
// Actual dismissal state is managed client-side in the hook.

const VALID_KEYS: Record<string, { id: string }> = {
  'candl_demo_key_jamied': { id: 'user_demo' },
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  let body: string;
  try {
    body = await readBody(req);
  } catch {
    return json(res, 400, { error: 'Failed to read body' });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as unknown;
  } catch {
    return json(res, 400, { error: 'Invalid JSON' });
  }

  const p = payload as Record<string, unknown>;
  const apiKey = typeof p['api_key'] === 'string' ? p['api_key'] : '';
  if (!VALID_KEYS[apiKey]) return json(res, 401, { error: 'Invalid API key' });

  return json(res, 200, { success: true });
}
