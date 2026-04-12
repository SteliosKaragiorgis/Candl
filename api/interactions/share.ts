import type { IncomingMessage, ServerResponse } from 'node:http';

// In-memory share count store — ephemeral per serverless instance.
// Frontend localStorage is the authoritative persistence layer.
const shareStore = new Map<string, number>();

const VALID_PLATFORMS = new Set(['twitter', 'whatsapp', 'telegram', 'copy']);

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
    return json(res, 405, { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  let rawBody: string;
  try {
    rawBody = await readBody(req);
  } catch {
    return json(res, 400, { error: 'Failed to read request body', code: 'BODY_READ_ERROR' });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    return json(res, 400, { error: 'Invalid JSON', code: 'INVALID_JSON' });
  }

  const p = payload as Record<string, unknown>;
  const postId   = typeof p['postId']   === 'string' ? p['postId'].trim()   : '';
  const userId   = typeof p['userId']   === 'string' ? p['userId'].trim()   : '';
  const platform = typeof p['platform'] === 'string' ? p['platform'].trim() : '';

  if (!postId) {
    return json(res, 400, { error: 'postId is required', code: 'MISSING_POST_ID' });
  }
  if (!userId) {
    return json(res, 400, { error: 'userId is required', code: 'MISSING_USER_ID' });
  }
  if (!platform) {
    return json(res, 400, { error: 'platform is required', code: 'MISSING_PLATFORM' });
  }
  if (!VALID_PLATFORMS.has(platform)) {
    return json(res, 400, {
      error: 'platform must be one of: twitter, whatsapp, telegram, copy',
      code: 'INVALID_PLATFORM',
    });
  }

  const current = shareStore.get(postId) ?? 0;
  const updated = current + 1;
  shareStore.set(postId, updated);

  return json(res, 200, { success: true, postId, shareCount: updated });
}
