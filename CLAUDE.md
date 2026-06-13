# CLAUDE.md — LifeQuest Landing Page

## What this is

Static landing page for LifeQuest — an AI life-coaching app for the 25–32-year-old who keeps starting and stopping on goals. The page is the validation instrument: it captures emails + survey responses + optional £5 founding deposits. Ship = page live at thelifequest.app with form writing to Supabase.

**This is NOT the app.** No React Native, no Expo, no backend proxy. Just a landing page.

---

## Stack

- Plain HTML + CSS + vanilla JS. No framework, no build step, no bundler.
- Deployed via Vercel (GitHub push → auto-deploy).
- Form data → Supabase REST API (fetch POST, anon key, INSERT-only RLS policy).
- Domain: thelifequest.app (Namecheap DNS → Vercel).

---

## File map

```
index.html      ← landing page (5 sections)
thank-you.html  ← post-signup page (survey + Stripe link)
privacy.html    ← GDPR privacy policy
style.css       ← shared styles
script.js       ← form submit, smooth scroll, thank-you survey
og.png          ← 1200×630 OG image
CLAUDE.md       ← this file
.env.example    ← env var template
```

---

## Copy source

Copy is LOCKED. Port verbatim from `../landing-page-copy-v1.0.md`. Do not rewrite, do not summarise, do not "improve". The exact wording has been validated.

Sections:
1. **Hero** — H1: "You don't have a discipline problem. You have an escape habit." + sub + email form
2. **What you get** — 4 blurbs (coach, skill tree, no streaks, escape habit)
3. **Founder note** — Ryan's personal story. This is the conversion lever. Don't compress it.
4. **The numbers** — 3 stats with citations (67%, 92%, £150–300/hr)
5. **Final CTA** — repeat email form + founding deposit framing

---

## Design rules

- **Dark background: `#080b0a`** (near-black). All sections use this background.
- **Text: white / near-white** (`#ffffff` for headings, `rgba(255,255,255,0.75)` for body text).
- **Feature cards:** slightly lighter dark background (`#111514` or `#1a1d1c`), `1px solid rgba(255,255,255,0.08)` border, `border-radius: 8px`, padding 24px.
- **Typography:** Inria Serif (Google Fonts) for headings (H1, H2, section titles). System sans-serif for body, labels, form elements. H1: large, normal weight in serif. Body 16px, line-height 1.7.
- Max content width: 720px, centred.
- **CTA button:** light/white fill with dark text — inverted against the dark page. Or a muted warm accent.
- **Form inputs:** dark background, white border (`rgba(255,255,255,0.2)`), white placeholder text.
- Mobile-first. Sections stack vertically. Form inputs full-width on mobile.
- No animations. Don't spend time on this.
- Reference: the existing Framer page at trylifequest.framer.website — match the aesthetic closely. Screenshots will be provided at build time if needed.

---

## Form behaviour

### Hero form + Section 5 form (both identical)

1. Email input (required, validate format client-side)
2. On submit: POST to Supabase `signups` table
3. On success: redirect to `/thank-you.html?email=[encoded-email]`
4. On error: show inline error message, do not redirect

### /thank-you.html

1. "You're on the list." heading
2. Survey question: "What's the one thing in your life you keep meaning to start — and haven't?" — open text, 200 char max
3. Two buttons: [Skip] [Send it]
4. On survey submit (or skip): redirect to Stripe Payment Link (hardcode URL — it's in Stripe dashboard)
5. Survey response POST to Supabase: UPDATE signups SET survey_response = ? WHERE email = ? (use email from URL param)

---

## Supabase integration

```javascript
const SUPABASE_URL = 'https://[project-ref].supabase.co'; // replace at setup
const SUPABASE_ANON_KEY = '[anon-key]'; // replace at setup — anon key is public-safe

// Insert email signup
async function insertSignup(email) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/signups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ email })
  });
  return res.status === 201;
}

// Update survey response
async function updateSurvey(email, surveyResponse) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/signups?email=eq.${encodeURIComponent(email)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ survey_response: surveyResponse })
  });
  return res.ok;
}
```

---

## Supabase table (create before first deploy)

```sql
CREATE TABLE public.signups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  survey_response text,
  source text DEFAULT 'landing',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert signups" ON public.signups FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon update survey" ON public.signups FOR UPDATE TO anon USING (true) WITH CHECK (true);
```

---

## OG / meta tags (index.html `<head>`)

```html
<meta property="og:title" content="LifeQuest — meaning over discipline">
<meta property="og:description" content="You don't have a discipline problem. You have an escape habit. LifeQuest is an AI life coach built around exactly that.">
<meta property="og:image" content="https://thelifequest.app/og.png">
<meta property="og:url" content="https://thelifequest.app">
<meta name="twitter:card" content="summary_large_image">
```

---

## Scope boundary (enforce strictly)

Build only what's in this file. If you're about to add something not on the list, stop and ask. The scope is parity with the previous Framer page — nothing more.

Do NOT add:
- Animations beyond CSS transitions
- Dark mode
- Pricing page
- Blog
- Analytics (can be added post-launch in 10 min)
- Logo SVG (text wordmark in heading font is fine)
- Custom illustration

---

## Deploy workflow

1. `git push origin main` → Vercel auto-deploys
2. Vercel preview URL: `[branch-name]-lifequest-landing.vercel.app` (for testing before DNS switch)
3. Production: thelifequest.app (once DNS is pointed at Vercel)

---

## Credentials (set as Vercel env vars — do not commit to repo)

- `SUPABASE_URL` — from Supabase dashboard → Settings → API
- `SUPABASE_ANON_KEY` — from Supabase dashboard → Settings → API (safe to expose client-side)
- `STRIPE_PAYMENT_LINK` — from Stripe dashboard → Payment Links (hardcode in HTML or env var)
