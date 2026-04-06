/**
 * GET   /api/challenges/:id  — fetch a single challenge
 * PATCH /api/challenges/:id  — update balance, rules, or days
 *
 * See src/app/api/challenges/route.ts for migration notes.
 */

import type { Challenge } from '../../../../types/propfirm';

function json<T>(data: T, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** GET /api/challenges/:id */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  // TODO: fetch from DB by params.id scoped to authenticated user
  return json<{ challenge: Challenge | null }>({ challenge: null });
}

/** PATCH /api/challenges/:id */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const patch = (await req.json()) as Partial<Challenge>;

  // TODO: validate + merge into DB record
  console.log('PATCH challenge', params.id, patch);

  return json({ ok: true });
}
