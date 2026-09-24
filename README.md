# Student Registration Form

A polished, responsive student registration form built with plain **HTML5**, **CSS3**, and **Vanilla JavaScript**, with free **email notifications** powered by [FormSubmit](https://formsubmit.co). No frameworks, no databases, no paid services.

**Live production URL:** https://computer-training-form.vercel.app

## What It Does

Presents a complete student registration form, validates every field on the client side with clear inline error messages, and — when everything is valid — sends a clean registration notification to the host's email via FormSubmit's AJAX endpoint (the visitor stays on the page). Passwords are validated locally but are **never** sent anywhere.

## Technologies Used

- **HTML5** — semantic markup, proper labels, appropriate input types, ARIA attributes
- **CSS3** — flexbox, responsive layout, custom properties (CSS variables), visible focus states
- **Vanilla JavaScript** — validation, safe payload construction, `fetch` AJAX submission
- **FormSubmit** — free external form-to-email provider (HTTPS POST from the browser)

## Features

- All required fields validated: Full Name, Email, Phone, Date of Birth, Gender, Course, Education Level, Address, Password, Confirm Password, and the Terms checkbox
- Inline validation messages (no `alert()` pop-ups)
- Email format, phone digit/separator, password length (≥ 8), confirm-password match, reasonable age (10–100), terms-required checks
- Live re-validation on blur plus real-time confirm-password re-checking
- Submission sends **only safe fields** (see below) to FormSubmit; passwords are excluded from the payload, the success/error messages, and never logged
- Submit button disables and shows "Submitting…" while the request is in flight (prevents duplicate submits)
- Visible generic error on failure — the visitor keeps their entered values and can retry
- FormSubmit honeypot field (`_honey`) for basic spam protection against auto-submitting bots
- FormSubmit's normal anti-spam behavior is left in its default state (the AJAX endpoint relies on its honeypot filtering)
- Reset button clears the form, error states, and banners
- Responsive on mobile, tablet, and desktop; keyboard-friendly with visible focus states
- Real favicon (`favicon.ico`) linked in the page header

## Validation

Full Name (required, ≥ 3 characters) · Email (format regex) · Phone (10–15 digits, allowing spaces/dashes/parentheses/leading `+`) · Date of Birth (not in the future, age 10–100) · Gender / Course / Education Level (required) · Address (required, ≥ 5 characters) · Password (≥ 8 characters) · Confirm Password (must match) · Terms & Conditions (must be checked).

## FormSubmit Integration

On a valid submission the page POSTs a JSON payload to:

```
https://formsubmit.co/ajax/<recipient-email>
```

The following fields are emailed (clearly named, all with `name` attributes):

- **Full Name**, **Email Address**, **Phone Number**, **Date of Birth**, **Gender**, **Course**, **Education Level**, **Address**
- Plus a **Submission Date/Time** stamp
- FormSubmit options: `_subject` ("New Student Registration — {full name}"), `_replyto` (the student's email), `_template` (table), and `_honey` (anti-spam honeypot)

**Password and Confirm Password are intentionally excluded.** The registration email footer notes that password fields are omitted for security.

### Required host-email configuration (one-time)

No host/admin email exists in the project (it intentionally does not ship with one). To activate notifications, set the recipient in **one clearly documented place**:

```js
// First constant at the top of script.js
var AppConfig = {
  formSubmitEmail: ''   // <-- put the host/admin email here, e.g. 'me@example.com'
};
```

- With `formSubmitEmail` empty, notifications are disabled and valid submissions show a friendly "try again later" message without sending anything.
- The **first real submission** to a new email triggers a one-time **activation email from FormSubmit**. Click the confirmation link it sends; only then does FormSubmit begin delivering notifications. No API key is required.

## How to Run It Locally

No build step is required — it is a static site.

1. Open the project folder.
2. Double-click **`index.html`** (or right-click → Open With → your browser).

Or serve it locally:

```bash
cd ~/computer-training-form
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Running the Tests

The repo ships an automated headless-browser test suite (Node + `puppeteer-core`, a development-only dependency). The FormSubmit network request is **stubbed**, so tests never depend on a live email service.

```bash
cd ~/computer-training-form
npm install        # once - installs the dev-only puppeteer-core
npm test           # runs tests against the local copy

# Optional: run the same suite against the live deployment
TEST_URL=https://computer-training-form.vercel.app npm test
```

`CHROME_PATH=/path/to/chrome` can be set if Chrome is not at the default `/usr/bin/google-chrome`.

## Project Structure

```
computer-training-form/
│
├── index.html        # Page markup, fields, honeypot, favicon link
├── style.css         # Styling: card, inputs, validation states, banners, responsive rules
├── script.js         # Validation, safe payload builder, FormSubmit AJAX submission
├── favicon.ico       # Site icon
├── tests/
│   └── run-tests.js  # Headless-browser test suite (stubs FormSubmit)
├── package.json      # Test script + dev-only puppeteer-core dependency
└── README.md         # This file
```

## Assignment Notes

- The form uses the `novalidate` attribute so all validation is performed by the project's own JavaScript.
- Error/success feedback always combines color with text, so it never relies on color alone.
- FormSubmit is the only external service used, and it handles the email delivery; the site itself stays static, free, and framework-free.