// LifeQuest landing — form submit + smooth scroll + thank-you survey
// Anon key is public-safe by design (INSERT/UPDATE-only RLS on signups table).

const SUPABASE_URL = 'https://rfltqamrgldxckcdgbhl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbHRxYW1yZ2xkeGNrY2RnYmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTk2MjcsImV4cCI6MjA4NzMzNTYyN30.FN8Z9rbpFpEVDAqP7WgV88ICmCSC33ovc4ClHw32kCA';
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/3cI8wO8rpfyn1QSfex6sw00'; // LIVE — real £5 charges (capped at 50 payments)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sbHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Prefer': 'return=minimal'
  };
}

async function insertSignup(email) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/signups`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify({ email })
  });
  return res.status === 201;
}

// Root cause of the old PATCH bug: RLS requires a SELECT policy for UPDATE's
// WHERE to see rows; anon has none (correctly — open SELECT would expose all
// emails). Fix: security-definer RPC updates server-side. SQL in project notes.
async function submitSurvey(email, surveyResponse) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_survey`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify({ p_email: email, p_answer: surveyResponse })
  });
  const body = await res.text().catch(() => '');
  if (!res.ok) console.error('Survey RPC problem:', res.status, body.slice(0, 300));
  return { ok: res.ok, status: res.status, body: res.ok ? 'saved via rpc' : body.slice(0, 300) };
}

// ---- Quest path: start at the base of the mountain range ----
function alignQuestPath() {
  const path = document.querySelector('.quest-path');
  const hero = document.querySelector('.starfield');
  if (path && hero) path.style.top = hero.offsetHeight + 'px';
}
window.addEventListener('load', alignQuestPath);
window.addEventListener('resize', alignQuestPath);
alignQuestPath();

// ---- Landing page: signup forms ----
document.querySelectorAll('.signup-form').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button');
    const error = form.parentElement.querySelector('.form-error');
    const email = input.value.trim().toLowerCase();

    error.classList.remove('visible');
    if (!EMAIL_RE.test(email)) {
      error.textContent = 'That email doesn’t look right — give it another go.';
      error.classList.add('visible');
      return;
    }

    button.disabled = true;
    try {
      const ok = await insertSignup(email);
      if (ok) {
        window.location.href = `/thank-you?email=${encodeURIComponent(email)}`;
        return;
      }
      throw new Error('insert failed');
    } catch (err) {
      error.textContent = 'Something went wrong — please try again in a moment.';
      error.classList.add('visible');
      button.disabled = false;
    }
  });
});

// ---- Thank-you page: survey ----
const surveyForm = document.getElementById('survey-form');
if (surveyForm) {
  const params = new URLSearchParams(window.location.search);
  const email = (params.get('email') || '').trim().toLowerCase();
  const textarea = document.getElementById('survey-text');
  const counter = document.getElementById('char-count');
  const skipBtn = document.getElementById('skip-btn');

  textarea.addEventListener('input', () => {
    counter.textContent = `${textarea.value.length} / 200`;
  });

  function goToStripe() {
    window.location.href = STRIPE_PAYMENT_LINK;
  }

  skipBtn.addEventListener('click', goToStripe);

  const debugMode = params.get('debug') === '1';

  surveyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const answer = textarea.value.trim().slice(0, 200);
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;
    let result = null;
    if (answer && email) {
      try { result = await submitSurvey(email, answer); }
      catch (err) { result = { ok: false, status: 0, body: String(err) }; }
      if (!result.ok) {
        try {
          const res2 = await fetch(`${SUPABASE_URL}/rest/v1/signups`, {
            method: 'POST',
            headers: sbHeaders(),
            body: JSON.stringify({ email, survey_response: answer, source: 'survey-fallback' })
          });
          result = { ok: res2.status === 201, status: res2.status, body: 'saved via fallback insert (update matched 0 rows — see task)' };
        } catch (e2) { /* original result stands */ }
      }
    }
    if (debugMode) {
      const pre = document.createElement('pre');
      pre.style.cssText = 'text-align:left;white-space:pre-wrap;font-size:13px;color:#f09595;margin-top:20px;';
      pre.textContent = 'DEBUG\nemail param: ' + email + '\nanswer sent: ' + (answer ? 'yes' : 'NO — empty') +
        '\nresult: ' + JSON.stringify(result, null, 2);
      surveyForm.appendChild(pre);
      sendBtn.disabled = false;
      return;
    }
    goToStripe();
  });
}
