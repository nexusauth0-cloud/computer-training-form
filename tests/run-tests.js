/* ==========================================================================
   Student Registration Form - automated headless-browser test suite
   --------------------------------------------------------------------------
   Run with:  npm install   (once, installs puppeteer-core)
              npm test

   Point at the live deployment instead of the local copy with:
              TEST_URL=https://computer-training-form.vercel.app npm test

   The FormSubmit network request is stubbed (mocked) so the suite does NOT
   depend on a live external email service. It proves the outgoing payload is
   correct and that the UI reacts to success/failure responses.
   ========================================================================== */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const LOCAL_URL = 'file://' + path.join(__dirname, '..', 'index.html');
const TEST_URL = process.env.TEST_URL || LOCAL_URL;

const SAFE_FIELDS = ['fullName', 'email', 'phone', 'dob', 'gender', 'course', 'education', 'address'];
const PAYLOAD_KEYS = [
  '_subject', '_replyto', '_template', '_honey', 'submission_date',
  'fullName', 'email', 'phone', 'dob', 'gender', 'course', 'education', 'address'
];

const results = [];
function check(name, pass, extra) {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${extra ? '  -> ' + extra : ''}`);
}

const VALID = {
  fullName: 'John Doe',
  email: 'jane@example.com',
  phone: '07012345678',
  dob: '2005-06-15',
  gender: 'Male',
  course: 'Web Development',
  education: 'Undergraduate',
  address: '12 Main Street, Lagos',
  password: 'secret123',
  confirmPassword: 'secret123'
};

async function fillValid(page) {
  await page.click('#fullName'); await page.type('#fullName', VALID.fullName);
  await page.click('#email'); await page.type('#email', VALID.email);
  await page.click('#phone'); await page.type('#phone', VALID.phone);
  await page.evaluate(() => { document.getElementById('dob').value = '2005-06-15'; });
  await page.evaluate(() => { document.querySelector('input[value="Male"]').checked = true; });
  await page.select('#course', VALID.course);
  await page.select('#education', VALID.education);
  await page.click('#address'); await page.type('#address', VALID.address);
  await page.click('#password'); await page.type('#password', VALID.password);
  await page.click('#confirmPassword'); await page.type('#confirmPassword', VALID.confirmPassword);
  await page.evaluate(() => { document.getElementById('terms').checked = true; });
}

async function openFresh(page) {
  await page.goto(TEST_URL, { waitUntil: 'load' });
  // Point the config at a placeholder and let tests stub the network call.
  await page.evaluate(() => { AppConfig.formSubmitEmail = 'host@example.com'; });
}

const errText = (page, id) =>
  page.$eval('#' + id + 'Error', el => el.textContent).catch(() => '');

async function waitVisible(page, sel, hidden) {
  // Args are passed explicitly - waitForFunction cannot see Node closure vars.
  await page.waitForFunction((selector, shouldHide) => {
    const el = document.querySelector(selector);
    return el && el.hidden === shouldHide;
  }, { timeout: 5000 }, sel, hidden);
}

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  } catch (err) {
    console.error('Could not launch Chrome at "' + CHROME + '". Set CHROME_PATH=/path/to/chrome.');
    process.exit(2);
  }
  const page = await browser.newPage();
  const consoleMessages = [];
  page.on('console', m => consoleMessages.push(m.type() + ': ' + m.text()));

  // Stub fetch BEFORE any page script runs: records requests, simulates
  // 'success' / 'fail' / 'pending' responses without touching the network.
  await page.evaluateOnNewDocument(() => {
    window.__fetches = [];
    window.__fetchMode = 'success';
    window.__resolveFetch = null;
    window.fetch = (url, options) => {
      let bodyText = null;
      try { bodyText = typeof options.body === 'string' ? options.body : JSON.stringify(options.body); } catch (e) { bodyText = null; }
      window.__fetches.push({ url: String(url), body: bodyText });
      const okResponse = { ok: true, status: 200, json: () => Promise.resolve({ success: 'true' }) };
      const failResponse = { ok: false, status: 500, json: () => Promise.resolve({}) };
      if (window.__fetchMode === 'fail') return Promise.resolve(failResponse);
      if (window.__fetchMode === 'pending') {
        return new Promise(resolve => { window.__resolveFetch = () => resolve(okResponse); });
      }
      return Promise.resolve(okResponse);
    };
  });

  /* ---------- Static structure checks ---------- */

  check('index.html exists', fs.existsSync(path.join(__dirname, '..', 'index.html')));
  check('style.css exists', fs.existsSync(path.join(__dirname, '..', 'style.css')));
  check('script.js exists', fs.existsSync(path.join(__dirname, '..', 'script.js')));
  check('favicon.ico exists', fs.existsSync(path.join(__dirname, '..', 'favicon.ico')));
  const ico = fs.readFileSync(path.join(__dirname, '..', 'favicon.ico'));
  check('favicon.ico is a valid ICO', ico.length > 22 && ico[0] === 0x00 && ico[1] === 0x00 && ico[2] === 0x01 && ico[3] === 0x00);

  await openFresh(page);
  check('page loads', await page.title() === 'Student Registration Form', await page.title());
  check('heading present', await page.$eval('.card__title', el => el.textContent.trim()) === 'Student Registration Form');
  check('subtitle present', await page.$eval('.card__subtitle', el => el.textContent.trim()) === 'Please complete the form below to register.');
  check('form present', await page.$('#registrationForm') !== null);
  check('favicon linked', await page.$eval('link[rel="icon"]', el => el.href.endsWith('favicon.ico') || el.href.includes('favicon.ico')));
  check('honeypot field present', await page.$('#honey') !== null);
  check('all 8 safe fields have name attributes', await page.evaluate(() => {
    // gender radios carry the name; the other fields are id'd inputs/selects
    const byId = ['fullName', 'email', 'phone', 'dob', 'course', 'education', 'address'];
    return byId.every(id => document.getElementById(id).getAttribute('name'))
      && !!document.querySelector('input[name="gender"]');
  }));
  check('submit button has id', await page.$('#submitButton') !== null);

  /* ---------- Test 1: empty submission ---------- */

  await page.click('button[type="submit"]');
  const missing = [];
  for (const id of ['fullName','email','phone','dob','gender','course','education','address','password','confirmPassword','terms']) {
    if (!(await errText(page, id))) missing.push(id);
  }
  check('#1 empty submit shows all 11 errors', missing.length === 0, missing.length ? 'missing: ' + missing.join(',') : '');
  check('#1 success message stays hidden', await page.$eval('#successMessage', el => el.hidden));
  check('#1 no network call on invalid submit', (await page.evaluate(() => window.__fetches.length)) === 0);

  /* ---------- Test 2: invalid email ---------- */

  await openFresh(page);
  await page.click('#email'); await page.type('#email', 'not-an-email');
  await page.click('button[type="submit"]');
  check('#2 invalid email rejected', /valid email/.test(await errText(page, 'email')), await errText(page, 'email'));

  /* ---------- Test 3: invalid phone ---------- */

  await openFresh(page);
  await page.click('#phone'); await page.type('#phone', '12345');
  await page.click('button[type="submit"]');
  check('#3 short phone rejected', /between 10 and 15/.test(await errText(page, 'phone')), await errText(page, 'phone'));
  await openFresh(page);
  await page.click('#phone'); await page.type('#phone', '0701abc4567');
  await page.click('button[type="submit"]');
  check('#3 phone with letters rejected', /only contain digits/.test(await errText(page, 'phone')), await errText(page, 'phone'));

  /* ---------- Test 4: invalid password ---------- */

  await openFresh(page);
  await page.click('#password'); await page.type('#password', 'short');
  await page.click('button[type="submit"]');
  check('#4 short password rejected', /at least 8/.test(await errText(page, 'password')), await errText(page, 'password'));

  /* ---------- Test 5: password mismatch ---------- */

  await openFresh(page);
  await page.click('#password'); await page.type('#password', 'secret123');
  await page.click('#confirmPassword'); await page.type('#confirmPassword', 'secret999');
  await page.click('button[type="submit"]');
  check('#5 password mismatch rejected', /do not match/.test(await errText(page, 'confirmPassword')), await errText(page, 'confirmPassword'));

  /* ---------- Test 6: terms required ---------- */

  await openFresh(page);
  await fillValid(page);
  await page.evaluate(() => { document.getElementById('terms').checked = false; });
  await page.click('button[type="submit"]');
  check('#6 terms required', /must accept/.test(await errText(page, 'terms')), await errText(page, 'terms'));

  /* ---------- Test 7/8/9: valid form reaches the FormSubmit flow ---------- */

  await openFresh(page);
  await page.evaluate(() => { window.__fetches = []; });
  await fillValid(page);
  await page.click('button[type="submit"]');
  await waitVisible(page, '#successMessage', false);
  const calls = await page.evaluate(() => window.__fetches);
  check('#7 valid form POSTs to FormSubmit AJAX endpoint', calls.length === 1 && /formsubmit\.co\/ajax\/host@example\.com$/.test(calls[0].url), calls.length ? calls[0].url : 'no call');
  const payload = calls.length ? JSON.parse(calls[0].body) : {};
  check('#8 payload contains only safe keys', JSON.stringify(Object.keys(payload).sort()) === JSON.stringify(PAYLOAD_KEYS.slice().sort()), Object.keys(payload).sort().join(','));
  const safeValues = SAFE_FIELDS.every(f => f === 'gender' ? payload.gender === VALID.gender : payload[f] === VALID[f]);
  check('#8 safe field values correct', safeValues);
  check('#8 _subject and _replyto set', /New Student Registration/.test(payload._subject) && payload._replyto === VALID.email, payload._subject + ' | ' + payload._replyto);
  check('#9 password NOT in payload (key + value)', !calls[0].body.includes('password') && !calls[0].body.includes(VALID.password));
  check('#9 confirmPassword NOT in payload (key + value)', !calls[0].body.includes('confirmPassword') && !calls[0].body.includes(VALID.confirmPassword));
  check('#14 success response shows success message', /Registration successful/.test(await page.$eval('#successMessage', el => el.textContent)));
  check('#15 success response clears the form', (await page.$eval('#fullName', el => el.value)) === '');
  check('#15 submission errors cleared after success', await page.evaluate(() => !document.querySelector('.field--invalid')));

  // button restored
  const btnState = await page.$eval('#submitButton', el => ({ disabled: el.disabled, text: el.textContent.trim(), inFlight: document.querySelector('.form') ? document.querySelector('.form').classList.contains('form--submitting') : false }));
  check('submit button restored after success', !btnState.disabled && btnState.text === 'Register' && !btnState.inFlight, JSON.stringify(btnState));

  /* ---------- Test 11: passwords never logged ---------- */

  const pwLeaks = consoleMessages.filter(m => m.includes(VALID.password) || m.includes(VALID.confirmPassword));
  check('#11 password never appears in console output', pwLeaks.length === 0, pwLeaks.join(' | '));

  /* ---------- Test 12: honeypot behaviour ---------- */

  await openFresh(page);
  await page.evaluate(() => { window.__fetches = []; });
  await fillValid(page);
  await page.evaluate(() => { document.getElementById('honey').value = 'I am a bot'; });
  await page.click('button[type="submit"]');
  await waitVisible(page, '#successMessage', false);
  const honeyCalls = await page.evaluate(() => window.__fetches.length);
  check('#12 honeypot filled: nothing is sent', honeyCalls === 0, 'calls=' + honeyCalls);
  check('#12 honeypot filled: silent success shown', !(await page.$eval('#successMessage', el => el.hidden)));

  // empty honeypot IS included as _honey for FormSubmit's server-side check
  await openFresh(page);
  await page.evaluate(() => { window.__fetches = []; });
  await fillValid(page);
  await page.click('button[type="submit"]');
  await waitVisible(page, '#successMessage', false);
  const honeyInPayload = await page.evaluate(() => window.__fetches[0] ? JSON.parse(window.__fetches[0].body)._honey === '' : 'no-call');
  check('honeypot _honey sent empty for real users', honeyInPayload === true, String(honeyInPayload));

  /* ---------- Test 13: submit button disabling ---------- */

  await openFresh(page);
  await page.evaluate(() => { window.__fetches = []; window.__fetchMode = 'pending'; });
  await fillValid(page);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => document.getElementById('submitButton').disabled, { timeout: 5000 });
  const midFlight = await page.$eval('#submitButton', el => ({ disabled: el.disabled, text: el.textContent.trim() }));
  check('#13 submit button disabled during submission', midFlight.disabled && midFlight.text === 'Submitting...', JSON.stringify(midFlight));
  check('#13 exactly one request in flight', (await page.evaluate(() => window.__fetches.length)) === 1);
  await page.evaluate(() => window.__resolveFetch && window.__resolveFetch());
  await waitVisible(page, '#successMessage', false);
  await page.waitForFunction(() => !document.getElementById('submitButton').disabled, { timeout: 5000 });
  const restored = await page.$eval('#submitButton', el => ({ disabled: el.disabled, text: el.textContent.trim() }));
  check('#13 duplicate submission prevented (button restores)', !restored.disabled && restored.text === 'Register', JSON.stringify(restored));

  /* ---------- Test 16/17: failed response ---------- */

  await openFresh(page);
  await page.evaluate(() => { window.__fetches = []; window.__fetchMode = 'fail'; });
  await fillValid(page);
  await page.click('button[type="submit"]');
  await waitVisible(page, '#submitError', false);
  const keepVal = await page.$eval('#fullName', el => el.value);
  check('#17 failed response shows a visible generic error', /could not submit|temporarily unavailable/.test(await page.$eval('#submitError', el => el.textContent)), await page.$eval('#submitError', el => el.textContent));
  check('#16 failed response preserves entered values', keepVal === VALID.fullName, 'fullName=' + keepVal);
  check('#16 no flash of success on failure', await page.$eval('#successMessage', el => el.hidden));
  const failBtn = await page.$eval('#submitButton', el => ({ disabled: el.disabled, text: el.textContent.trim() }));
  check('#16 submit button restored after failure', !failBtn.disabled && failBtn.text === 'Register', JSON.stringify(failBtn));

  /* ---------- Test 10: unconfigured notifications are handled safely ---------- */

  await page.goto(TEST_URL, { waitUntil: 'load' }); // AppConfig.formSubmitEmail stays ''
  await page.evaluate(() => { window.__fetches = []; });
  await fillValid(page);
  await page.click('button[type="submit"]');
  await waitVisible(page, '#submitError', false);
  check('#10 unconfigured email: no network call', (await page.evaluate(() => window.__fetches.length)) === 0);
  check('#10 unconfigured email: visible non-alarming error', await page.$eval('#submitError', el => el.hidden === false));

  /* ---------- Test 18: reset ---------- */

  await page.goto(TEST_URL, { waitUntil: 'load' });
  await page.evaluate(() => { AppConfig.formSubmitEmail = 'host@example.com'; });
  await page.evaluate(() => { document.getElementById('fullName').value = 'X'; document.getElementById('email').value = 'bad'; });
  await page.click('button[type="submit"]'); // triggers errors
  await page.click('button[type="reset"]');
  check('#18 reset clears fields', (await page.$eval('#fullName', el => el.value)) === '');
  check('#18 reset clears error states', await page.evaluate(() => !document.querySelector('.field--invalid')));
  check('#18 reset hides success + error banners', await page.evaluate(() => document.getElementById('successMessage').hidden && document.getElementById('submitError').hidden));
  check('#18 reset leaves submit button enabled', !(await page.$eval('#submitButton', el => el.disabled)));

  /* ---------- Test 19: responsive ---------- */

  for (const w of [375, 768, 1440]) {
    await page.setViewport({ width: w, height: 900 });
    await page.goto(TEST_URL, { waitUntil: 'load' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check(`#19 no horizontal overflow @${w}px`, !overflow, `scrollWidth=${await page.evaluate(() => document.documentElement.scrollWidth)}`);
  }

  /* ---------- Test 20: favicon ---------- */

  check('favicon.ico is a valid ICO (re-check)', ico.length > 22 && ico[2] === 0x01);

  /* ---------- Overall console health ---------- */

  const errors = consoleMessages.filter(m => m.startsWith('error') || m.startsWith('pageerror'));
  check('no console errors', errors.length === 0, errors.join(' | '));

  const failed = results.filter(r => !r.pass).length;
  await browser.close();
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch(err => { console.error('TEST RUNNER ERROR:', err); process.exit(2); });