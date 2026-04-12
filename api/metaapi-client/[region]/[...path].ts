import type { IncomingMessage, ServerResponse } from 'node:http';

const METAAPI_TOKEN = process.env.METAAPI_TOKEN ?? '';

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const ALLOWED_REGIONS = new Set(['new-york', 'london', 'singapore', 'sydney']);

export default async function handler(
  req: IncomingMessage & { query?: Record<string, string | string[]> },
  res: ServerResponse,
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,auth-token');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

  if (!METAAPI_TOKEN) {
    res.statusCode = 500;
    res.end(JSON.stringify({ message: 'METAAPI_TOKEN not configured on server.' }));
    return;
  }

  // Extract region from path: /api/metaapi-client/{region}/...
  const url    = req.url ?? '/';
  const match  = url.match(/^\/api\/metaapi-client\/([^/]+)(\/.*)?$/);
  const region = match?.[1] ?? '';
  const rest   = match?.[2] ?? '/';

  if (!ALLOWED_REGIONS.has(region)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ message: `Unknown region: ${region}` }));
    return;
  }

  const upstreamUrl = `https://mt-client-api-v1.${region}.agiliumtrade.ai${rest}`;

  const body = ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : await readBody(req);

  const upstreamRes = await fetch(upstreamUrl, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'auth-token': METAAPI_TOKEN,
    },
    body: body?.length ? body : undefined,
  });

  res.statusCode = upstreamRes.status;
  res.setHeader('Content-Type', 'application/json');
  const text = await upstreamRes.text();
  res.end(text);
}
