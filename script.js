// LifeQuest landing — form submit + smooth scroll + thank-you survey
// Anon key is public-safe by design (INSERT/UPDATE-only RLS on signups table).

const SUPABASE_URL = 'https://rfltqamrgldxckcdgbhl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmbHRxYW1yZ2xkeGNrY2RnYmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTk2MjcsImV4cCI6MjA4NzMzNTYyN30.FN8Z9rbpFpEVDAqP7WgV88ICmCSC33ovc4ClHw32kCA';
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_cNi9AS0XLbth7RD1wG9IQ00'; // TEST MODE — swap to live link before marketing traffic

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

async function updateSurvey(email, surveyResponse) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/signups?email=eq.${encodeURIComponent(email)}`, {
    method: 'PATCH',
    headers: sbHeaders(),
    body: JSON.stringify({ survey_response: surveyResponse })
  });
  return res.ok;
}

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

  surveyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const answer = textarea.value.trim().slice(0, 200);
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;
    if (answer && email) {
      try { await updateSurvey(email, answer); } catch (err) { /* don't block the redirect */ }
    }
    goToStripe();
  });
}
