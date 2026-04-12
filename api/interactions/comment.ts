import type { IncomingMessage, ServerResponse } from 'node:http';

interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  body: string;
  createdAt: string;
}

// In-memory comment store — ephemeral per serverless instance.
// Frontend localStorage is the authoritative persistence layer.
const commentStore = new Map<string, Comment[]>();

const BODY_MAX_LENGTH = 500;

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
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    res.end();
    return;
  }

  // GET — return comments for a post
  if (req.method === 'GET') {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const postId = url.searchParams.get('postId') ?? '';

    if (!postId) {
      return json(res, 400, { error: 'postId query param is required', code: 'MISSING_POST_ID' });
    }

    const comments = commentStore.get(postId) ?? [];
    return json(res, 200, { success: true, postId, comments });
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
  const userName = typeof p['userName'] === 'string' ? p['userName'].trim() : '';
  const body     = typeof p['body']     === 'string' ? p['body'].trim()     : '';

  if (!postId) {
    return json(res, 400, { error: 'postId is required', code: 'MISSING_POST_ID' });
  }
  if (!userId) {
    return json(res, 400, { error: 'userId is required', code: 'MISSING_USER_ID' });
  }
  if (!body) {
    return json(res, 400, { error: 'body is required', code: 'MISSING_BODY' });
  }
  if (body.length > BODY_MAX_LENGTH) {
    return json(res, 400, {
      error: `body must not exceed ${BODY_MAX_LENGTH} characters`,
      code: 'BODY_TOO_LONG',
    });
  }

  const comment: Comment = {
    id: `cmt-${Date.now()}`,
    postId,
    userId,
    userName: userName || userId,
    body,
    createdAt: new Date().toISOString(),
  };

  if (!commentStore.has(postId)) {
    commentStore.set(postId, []);
  }
  commentStore.get(postId)!.push(comment);

  return json(res, 200, { success: true, comment });
}
