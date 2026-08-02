// Supabase free tier pauses a project after ~7 days of no API activity.
// This page writes email signups and survey responses to that project, so a
// pause means the form fails silently and signups are lost with no error shown.
//
// Vercel Cron hits this route once a day, which resets the clock.
// The anon key is already public — it ships in script.js and is protected by
// INSERT/UPDATE-only RLS on the signups table. No new exposure here.

const SUPABASE_URL = 'https://rfltqamrgldxckcdgbhl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbHRxYW1yZ2xkeGNrY2RnYmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTk2MjcsImV4cCI6MjA4NzMzNTYyN30.FN8Z9rbpFpEVDAqP7WgV88ICmCSC33ovc4ClHw32kCA';

export default async function handler(req, res) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
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
