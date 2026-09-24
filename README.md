# Student Registration Form

A polished, responsive student registration form built with plain **HTML5**, **CSS3**, and **Vanilla JavaScript** — no frameworks, no libraries.

## What It Does

Presents a complete student registration form to users, validates every field on the client side with clear, inline error messages, and shows a success message only when the entire form is valid. It never sends data to a server.

## Technologies Used

- **HTML5** — semantic markup, proper labels, appropriate input types, ARIA attributes
- **CSS3** — flexbox, grid-free responsive layout, custom properties (CSS variables), visible focus states
- **Vanilla JavaScript** — regex validation, DOM manipulation, event handling

## Features

- **All required fields** validated: Full Name, Email, Phone, Date of Birth, Gender, Course, Education Level, Address, Password, Confirm Password, and the Terms & Conditions checkbox
- **Inline validation messages** — errors appear under the offending field (no `alert()` pop-ups)
- **Email format** validation with a simple regex
- **Phone number** validation (allows digits, spaces, dashes, parentheses, and a leading `+`)
- **Password** must be at least 8 characters; **Confirm Password** must match
- **Terms checkbox** must be ticked before submitting
- **Date of birth** cannot be in the future and must indicate a reasonable student age (10–100)
- **Live re-validation** on blur, plus real-time re-checking of the confirm-password field
- **Polished success message**: "Registration successful! Your details have been submitted."
- Passwords are **never** shown in the success message or the console
- **Reset button** clears the form and all error states
- Responsive on mobile, tablet, and desktop
- Keyboard-friendly with visible focus states

## How to Run It Locally

No build step or server is required — it is a static site.

1. Open the project folder.
2. Double-click **`index.html`** (or right-click → Open With → your browser).

Alternatively, run a tiny local server:

```bash
cd ~/computer-training-form
python3 -m http.server 8000
```

Then visit <http://localhost:8000> in your browser.

## Project Structure

```
computer-training-form/
│
├── index.html   # Form markup, page structure, and accessible field labels
├── style.css    # All styling: layout, card, inputs, validation states, responsive rules
├── script.js    # Validation logic, error display, submit/reset behavior
└── README.md    # This file
```

## Assignment Notes

- The form uses the `novalidate` attribute so that all validation is performed by the project's own JavaScript (showcasing the skills in the assignment).
- Error feedback uses both color and text, so it is accessible to screen readers and does not rely on color alone.