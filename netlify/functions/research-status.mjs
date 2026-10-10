// Server-only SonoraPort research health endpoint. Never exposes registry rows or credentials.
export default async function handler(request) {
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
  const url = process.env.SONORAPORT_SUPABASE_URL;
  const key = process.env.SONORAPORT_SUPABASE_SERVER_KEY;
  if (!url || !key || !/^https:\/\/[a-z0-9.-]+\.supabase\.co\/?$/i.test(url)) {
    return Response.json({ service: 'sonoraport-research', configured: false, live: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let response;
    try {
      response = await fetch(url.replace(/\/$/, '') + '/rest/v1/kino_research_registry?select=id&limit=1', {
        headers: { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'count=exact' },
        signal: controller.signal,
      });
    } finally { clearTimeout(timeout); }
    if (!response.ok) return Response.json({ service: 'sonoraport-research', configured: true, live: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    return Response.json({ service: 'sonoraport-research', configured: true, live: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ service: 'sonoraport-research', configured: true, live: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
export const config = { path: '/api/research-status' };
