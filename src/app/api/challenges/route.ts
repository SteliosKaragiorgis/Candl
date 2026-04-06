/**
 * GET  /api/challenges  — list all challenges for the current user
 * POST /api/challenges  — create a new challenge
 *
 * These handlers follow the Next.js App Router convention.
 * In the current Vite build they are not auto-served; persistence is handled
 * via localStorage in src/hooks/useChallenge.ts. Migrate these to a real
 * backend (e.g. Vercel Edge Functions or a Supabase RPC) when ready.
 */

import type { Challenge } from '../../../types/propfirm';

// Stub response helper (mirrors NextResponse shape for easy migration)
function json<T>(data: T, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** GET /api/challenges */
export async function GET(_req: Request) {
  // TODO: replace with DB query keyed to authenticated user
  return json<{ challenges: Challenge[] }>({ challenges: [] });
}

/** POST /api/challenges */
export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Challenge, 'id' | 'created_at'>;

  // TODO: validate + persist to DB
  const created: Challenge = {
    ...body,
    id: `challenge-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  return json({ challenge: created }, 201);
}
