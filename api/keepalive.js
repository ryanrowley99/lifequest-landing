// Supabase free tier pauses a project after ~7 days of no API activity.
// This page writes email signups and survey responses to that project, so a
// pause means the form fails silently and signups are lost with no error shown.
//
// Vercel Cron hits this route once a day, which resets the clock.
// The anon key is already public — it ships in script.js and is protected by
// INSERT/UPDATE-only RLS on the signups table. No new exposure here.

const SUPABASE_URL = 'https://rfltqamrgldxckcdgbhl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0Uu9MVVwXE4-T8YQimQ-aA_SR5G589O';

export default async function handler(req, res) {
  try {
    // A real table read, not the PostgREST root (which 401s) and not
    // /auth/v1/health (which answers without touching the database).
    // RLS is INSERT/UPDATE-only on signups, so this returns 200 with [] —
    // the empty array is expected and is not a failure.
    const r = await fetch(`${SUPABASE_URL}/rest/v1/signups?select=id&limit=1`, {
      headers: {
        apikey: SUPABASE_ANON_KEY
      }
    });

    const ok = r.status === 200;

    return res.status(ok ? 200 : 500).json({
      ok,
      supabase_status: r.status,
      checked_at: new Date().toISOString(),
      note: ok
        ? 'Project awake. Pause clock reset.'
        : 'Supabase did not return 200 — project may be paused or key rotated.'
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
