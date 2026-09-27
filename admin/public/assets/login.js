// Two-step sign-in: password, then the 6-digit authenticator code (or a recovery code).
const pwForm = document.getElementById('password-form');
const codeForm = document.getElementById('code-form');
const recForm = document.getElementById('recovery-form');

function show(form) {
  for (const f of [pwForm, codeForm, recForm]) f.hidden = f !== form;
  form.querySelector('input')?.focus();
}

function setError(form, message) {
  const el = form.querySelector('.error');
  el.textContent = message ?? '';
  el.hidden = !message;
}

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function submit(form, url, body, onOk) {
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  setError(form, '');
  try {
    const res = await post(url, body);
    if (res.ok) return onOk(res.data);
    if (res.status === 401 && /expired/i.test(res.data.error ?? '')) {
      show(pwForm);
      setError(pwForm, res.data.error);
      return;
    }
    setError(form, res.data.error ?? 'Sign-in failed. Try again.');
  } catch {
    setError(form, 'No connection. Check your internet and try again.');
  } finally {
    btn.disabled = false;
  }
}

pwForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const password = pwForm.password.value;
  if (!password) return setError(pwForm, 'Enter your password.');
  submit(pwForm, '/api/login/password', { password }, () => {
    pwForm.reset();
    show(codeForm);
  });
});

codeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const code = codeForm.code.value.replace(/\s/g, '');
  if (!/^\d{6}$/.test(code)) return setError(codeForm, 'The code has 6 digits.');
  submit(codeForm, '/api/login/code', { code }, () => location.replace('/'));
});

// Submit automatically once 6 digits are typed or pasted.
codeForm.code.addEventListener('input', () => {
  codeForm.code.value = codeForm.code.value.replace(/\D/g, '').slice(0, 6);
  if (codeForm.code.value.length === 6) codeForm.requestSubmit();
});

recForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const recovery = recForm.recovery.value.trim();
  if (!recovery) return setError(recForm, 'Enter a recovery code.');
  submit(recForm, '/api/login/code', { recovery }, () => location.replace('/'));
});

document.getElementById('use-recovery').addEventListener('click', () => show(recForm));
document.getElementById('use-code').addEventListener('click', () => show(codeForm));
pwForm.password.focus();
