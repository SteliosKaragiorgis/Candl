import type { IncomingMessage, ServerResponse } from 'node:http';

// In-memory like store — ephemeral per serverless instance.
// Frontend localStorage is the authoritative persistence layer.
const likeStore = new Map<string, Set<string>>();

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
  const postId  = typeof p['postId']  === 'string' ? p['postId'].trim()  : '';
  const userId  = typeof p['userId']  === 'string' ? p['userId'].trim()  : '';
  const action  = typeof p['action']  === 'string' ? p['action']         : '';

  if (!postId) {
    return json(res, 400, { error: 'postId is required', code: 'MISSING_POST_ID' });
  }
  if (!userId) {
    return json(res, 400, { error: 'userId is required', code: 'MISSING_USER_ID' });
  }
  if (action !== 'like' && action !== 'unlike') {
    return json(res, 400, { error: 'action must be "like" or "unlike"', code: 'INVALID_ACTION' });
  }

  if (!likeStore.has(postId)) {
    likeStore.set(postId, new Set());
  }
  const likers = likeStore.get(postId)!;

  if (action === 'like') {
    likers.add(userId);
    return json(res, 200, { success: true, postId, action, likeCount: likers.size, notification: true });
  } else {
    likers.delete(userId);
    return json(res, 200, { success: true, postId, action, likeCount: likers.size, notification: false });
  }
}
