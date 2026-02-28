# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cyber Essentials Readiness Checker — a client-side web app that evaluates an organisation's readiness for UK Cyber Essentials v3.3 certification and CAF (Cyber Assessment Framework) compliance. Pure HTML/CSS/vanilla JS with no build step; a Firebase Cloud Function proxies requests to the Claude API. Both the frontend and API are hosted on Firebase (`cyber-essentials-checker.web.app`).

## Development

No build, no bundler, no package manager needed for the frontend. To run locally, serve the files with any HTTP server:

```bash
python -m http.server 8000
# visit http://localhost:8000
```

For the API proxy (Cloud Functions), deploy to Firebase with `ANTHROPIC_API_KEY` set as a secret:

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
firebase deploy                # deploy hosting + functions
firebase emulators:start       # local dev with hosting + functions
```

There is no test suite. Manual testing covers: auth flow, assessment completion, auto-save, local-analysis fallback, PDF export, and supply chain vendor flow.

## Architecture

```
index.html              Landing page — 3 service cards (free CE, enhanced CE, CAF)
   ↓ click card
login.html              Login/registration (Firebase Auth, MFA)
   ↓ redirect (reads ?redirect= param)
assessment.html         CE Assessment UI — 7 collapsible sections
assessment.js           CE assessment logic (single ~2000-line file)
assessment.css          CE assessment styles
caf-assessment.html     CAF Assessment UI
caf-assessment.js       CAF assessment logic
caf-assessment.css      CAF assessment styles
firebase-config.js      Public Firebase SDK config
api/analyze.js          Vercel serverless proxy → Claude API
api/hello.js            Health-check endpoint (returns { ok: true })
```

### How the app works

1. **Landing page** — `index.html` is a public landing page with 3 service cards. Clicking the free CE card navigates to `login.html?redirect=assessment`. Clicking the CAF card navigates to the CAF assessment (`caf-assessment.html`).

2. **Auth** — `login.html` handles login/registration/MFA via Firebase Auth SDK v10.7.1 (loaded as ESM from CDN, pinned in three HTML files). Reads `?redirect=` param against `ALLOWED_REDIRECTS` whitelist (`assessment` → `assessment.html`, `caf-assessment` → `caf-assessment.html`). Adding a new protected page requires updating this map in `login.html`. Supports email/password and Google Sign-In, with optional TOTP MFA enrollment.

3. **Assessment** — 6 core Cyber Essentials controls (firewalls, secure config, updates, access control, malware, scope) plus an optional 7th supply chain section. Each control has multiple-choice questions (radio buttons with `data-control` attribute mapping to controls 1-6) and required free-text fields.

4. **Conditional branching** — Questions use `data-show-if="<radioName>:<value1>|<value2>"` to show/hide based on parent answers. Hidden question answers are auto-cleared by `updateConditionalQuestions()` to avoid stale scoring. Five conditional questions exist (triggered by `q1_3`, `q2_2`, `q3_1`, `q4_3`, `q6_3`).

5. **Supply chain** — Optional vendor assessment module. Vendors are added dynamically; each gets 8 weighted security questions rendered in `.vendor-question` divs. Vendor radios do NOT have `data-control` attributes (important: `collectResponses()` must skip them).

6. **Auto-save** — All state (radio selections, text inputs, vendors) saves to `localStorage` every 1 second via debounce. Keys: `cyber-essentials-assessment` (CE), `caf_assessment_v1` (CAF).

7. **Analysis** — Two paths:
   - **Primary**: `analyzeWithProxy()` sends responses + system prompt to `/api/analyze` (same-origin rewrite to Firebase Cloud Function) → Claude API → structured JSON result.
   - **Fallback**: `performLocalAnalysis()` scores locally in JS if the API is unavailable.

8. **Results display** — `displayResults()` builds the results DOM (XSS-safe via `escapeHtml()` and `document.createElement`). Includes radar chart, heatmap, score bars, vendor risk table, critical issues, and next steps.

9. **PDF export** — `printToPDF()` prompts for company name, adds header/appendix, then calls `window.print()`.

10. **CAF assessment** — `caf-assessment.html/js/css` provides a separate assessment flow for the NCSC Cyber Assessment Framework (14 principles, 83 questions). Uses the same Firebase Cloud Function API proxy for analysis. Also has a JSON export feature (`exportJSON()`).

### Key data structures

- **Responses object** (`collectResponses()`): `{ controls: { firewalls: {}, secureConfig: {}, updates: {}, accessControl: {}, malware: {}, scope: {} }, textInputs: { ... } }`
- **Analysis result**: `{ overallStatus, readinessScore, controlScores, criticalIssues[], warnings[], strengths[], nextSteps[], summary, timeline }`
- **Vendors array**: Each vendor has `{ id, name, accessLevel, questions: {} }` with risk calculated via weighted scoring and access-level multipliers. Vendor risk scoring: 8 questions with weights 1-3, `pass` = full weight, `partial` = half, `fail`/`unsure` = 0. Raw score is scaled to 0-100, then adjusted by access-level multiplier (`system: 1.5`, `network: 1.3`, `data: 1.2`, `physical: 1.1`, `cloud: 1.1`, `limited: 0.7`). Risk levels: `>=70` low, `40-69` medium, `<40` high.
- **CAF scoring**: `SCORE_MAP` maps `achieved: 100`, `partial: 50`, `not-achieved: 0`, `na: null` (excluded from averages). Rating thresholds: `>=70%` Achieved, `40-69%` Partially Achieved, `<40%` Not Achieved.

### localStorage keys

| Key | Purpose |
|-----|---------|
| `cyber-essentials-assessment` | CE assessment state (radios, text, vendors, version `'1.2'`, timestamp) |
| `caf_assessment_v1` | CAF radio state + sector selection |
| `caf_assessment_v1_ts` | ISO timestamp of last CAF save |
| `ce-checker-supply-chain` | `'yes'`/`'no'` — supply chain opt-in |
| `ce-checker-welcome-seen` | CE welcome modal dismissed |
| `caf_welcomed` | CAF welcome modal dismissed |
| `userEmail` / `userName` | Cached Firebase user info |
| `firebaseAuthComplete` | Temporary auth flag (set by login, cleared by assessment) |

Note: `logout()` in `assessment.html` calls `localStorage.clear()`, which wipes all keys including saved assessment progress.

### CDN dependencies

| Library | Version | CDN URL | Used in |
|---------|---------|---------|---------|
| Firebase App SDK | 10.7.1 | `https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js` | login.html, assessment.html, caf-assessment.html |
| Firebase Auth SDK | 10.7.1 | `https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js` | login.html, assessment.html, caf-assessment.html |
| QRious | 4.0.2 | `https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js` | login.html (TOTP QR codes) |
| Google Fonts (Inter) | — | `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800` | index.html, assessment.html, caf-assessment.html |

All scripts use ES module (`type="module"`) imports. Firebase SDK version is pinned to 10.7.1 across all three HTML files.

### Firebase Auth

**Services used:** Authentication only. No Firestore, Realtime Database, Storage, Cloud Functions, or Analytics are initialised.

**Auth methods implemented in `login.html`:**

| Method | Firebase API |
|--------|-------------|
| Email/password sign-in | `signInWithEmailAndPassword(auth, email, password)` |
| Email/password registration | `createUserWithEmailAndPassword(auth, email, password)` |
| Google Sign-In | `signInWithPopup(auth, new GoogleAuthProvider())` |
| Password reset | `sendPasswordResetEmail(auth, email)` |
| TOTP MFA enrolment | `TotpMultiFactorGenerator.generateSecret()` → `multiFactor(user).enroll()` |
| TOTP MFA sign-in challenge | `TotpMultiFactorGenerator.assertionForSignIn()` → `mfaResolver.resolveSignIn()` |
| Session persistence | `setPersistence(auth, browserLocalPersistence)` |
| Profile update | `updateProfile(user, { displayName })` |

**Auth state on protected pages (`assessment.html`, `caf-assessment.html`):**

Both pages import `onAuthStateChanged` and `signOut`. If no user is detected, the page redirects to `login.html?redirect=<page>`. The `logout()` function calls `signOut(auth)` then `localStorage.clear()`.

**Error codes handled** (`getErrorMessage()` in `login.html`):

`auth/email-already-in-use`, `auth/invalid-email`, `auth/weak-password`, `auth/user-disabled`, `auth/user-not-found`, `auth/wrong-password`, `auth/invalid-credential`, `auth/too-many-requests`, `auth/network-request-failed`, `auth/popup-closed-by-user`, `auth/multi-factor-auth-required`, `auth/invalid-verification-code`, `auth/requires-recent-login`.

### Important conventions

- All user-supplied text rendered in the DOM must go through `escapeHtml()` or use `.textContent`. Never use `.innerHTML` with user data.
- Radio buttons for the 6 core controls live inside `.question[data-control]` divs. Vendor radios live inside `.vendor-question` divs and must be excluded from `collectResponses()`.
- Required text fields are listed in `REQUIRED_TEXT_FIELDS` array (line 341) and validated in `validateTextInputs()` before analysis runs.
- The API proxy (`functions/analyze.js`) validates: prompt length (max 50k chars), model whitelist (`claude-sonnet-4-5-20250929`, `claude-haiku-4-5-20251001`), max_tokens (100-4000), temperature (0-1).
- `caf-assessment.js` uses `'use strict'`; `assessment.js` does not.

### Adding or editing questions

Questions in `assessment.html` follow this template (see `EDITING_QUESTIONS_GUIDE.md` for full details):

```html
<div class="question" data-control="X" data-critical="true/false">
    <div class="question-text">Clear, specific question?</div>
    <div class="question-help">Helpful context for the user</div>
    <div class="options">
        <label class="option">
            <input type="radio" name="qX_Y" value="pass">
            <span>Answer option</span>
        </label>
    </div>
</div>
```

`data-control` maps to controls 1-6, `data-critical="true"` flags mandatory questions, and `name` must be unique across the form.

## File layout

| File | Purpose |
|------|---------|
| `index.html` | Public landing page with 3 service cards |
| `login.html` | Login/register page with inline Firebase Auth JS |
| `assessment.html` | CE assessment form markup (7 control sections, modals) — also contains inline `<script>` with `askConsultant()` Oracle feature (uses relative `/api/analyze` URL, works via Firebase Hosting rewrite) |
| `assessment.js` | CE assessment logic: auto-save, branching, collection, validation, analysis, results, PDF, vendors |
| `assessment.css` | CE assessment styling including print rules and responsive breakpoints |
| `caf-assessment.html` | CAF assessment form markup |
| `caf-assessment.js` | CAF assessment logic |
| `caf-assessment.css` | CAF assessment styling |
| `firebase-config.js` | Firebase project config (public client-side keys) |
| `functions/index.js` | Firebase Cloud Functions entry point (exports `analyze` and `hello`) |
| `functions/analyze.js` | API proxy handler — proxies requests to Claude API |
| `firebase.json` | Firebase Hosting config + Cloud Functions rewrites |
| `.firebaserc` | Firebase project alias (`cyber-essentials-checker`) |
| `package.json` | Node engine constraint (>=18) |
| `RELEASE_NOTES.md` | Per-version release notes |
| `CHANGELOG.md` | Chronological changelog |
| `CONTRIBUTING.md` | Contribution guidelines |
| `DEPLOYMENT_GUIDE.md` | Deployment instructions |
| `EDITING_QUESTIONS_GUIDE.md` | Guide for editing assessment questions |
| `QUICK_START.md` | Quick-start guide |
