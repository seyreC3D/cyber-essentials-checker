# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cyber Essentials Readiness Checker — a client-side web app that evaluates an organisation's readiness for UK Cyber Essentials v3.3 certification and CAF (Cyber Assessment Framework) compliance. Pure HTML/CSS/vanilla JS with no build step; a single Vercel serverless function proxies requests to the Claude API. The frontend is hosted on GitHub Pages (`seyrec3d.github.io/cyber-assessment-hub`), and the API proxy is hosted on Vercel (`cyber-assessment-hub.vercel.app`).

## Development

No build, no bundler, no package manager needed for the frontend. To run locally, serve the files with any HTTP server:

```bash
python -m http.server 8000
# visit http://localhost:8000
```

For the API proxy (`api/analyze.js`), deploy to Vercel with `ANTHROPIC_API_KEY` set as an environment variable:

```bash
vercel            # deploy
vercel dev        # local dev with serverless functions
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

2. **Auth** — `login.html` handles login/registration/MFA via Firebase Auth SDK (loaded from CDN). Reads `?redirect=` param (whitelisted) to determine post-auth destination. On success, redirects to the target page.

3. **Assessment** — 6 core Cyber Essentials controls (firewalls, secure config, updates, access control, malware, scope) plus an optional 7th supply chain section. Each control has multiple-choice questions (radio buttons with `data-control` attribute mapping to controls 1-6) and required free-text fields.

4. **Conditional branching** — Some questions are shown/hidden based on parent answers. Hidden question answers are auto-cleared to avoid stale scoring.

5. **Supply chain** — Optional vendor assessment module. Vendors are added dynamically; each gets 8 weighted security questions rendered in `.vendor-question` divs. Vendor radios do NOT have `data-control` attributes (important: `collectResponses()` must skip them).

6. **Auto-save** — All state (radio selections, text inputs, vendors) saves to `localStorage` every 1 second via debounce.

7. **Analysis** — Two paths:
   - **Primary**: `analyzeWithProxy()` sends responses + system prompt to `https://cyber-assessment-hub.vercel.app/api/analyze` → Claude API → structured JSON result. (Absolute URL required because the frontend is on GitHub Pages.)
   - **Fallback**: `performLocalAnalysis()` scores locally in JS if the API is unavailable.

8. **Results display** — `displayResults()` builds the results DOM (XSS-safe via `escapeHtml()` and `document.createElement`). Includes radar chart, heatmap, score bars, vendor risk table, critical issues, and next steps.

9. **PDF export** — `printToPDF()` prompts for company name, adds header/appendix, then calls `window.print()`.

10. **CAF assessment** — `caf-assessment.html/js/css` provides a separate assessment flow for the NCSC Cyber Assessment Framework. Uses the same Vercel API proxy for analysis.

### Key data structures

- **Responses object** (`collectResponses()`): `{ controls: { firewalls: {}, secureConfig: {}, updates: {}, accessControl: {}, malware: {}, scope: {} }, textInputs: { ... } }`
- **Analysis result**: `{ overallStatus, readinessScore, controlScores, criticalIssues[], warnings[], strengths[], nextSteps[], summary, timeline }`
- **Vendors array**: Each vendor has `{ id, name, accessLevel, questions: {} }` with risk calculated via weighted scoring and access-level multipliers.

### Important conventions

- All user-supplied text rendered in the DOM must go through `escapeHtml()` or use `.textContent`. Never use `.innerHTML` with user data.
- Radio buttons for the 6 core controls live inside `.question[data-control]` divs. Vendor radios live inside `.vendor-question` divs and must be excluded from `collectResponses()`.
- Required text fields are listed in `REQUIRED_TEXT_FIELDS` array (~line 333) and validated in `validateTextInputs()` before analysis runs.
- The API proxy (`api/analyze.js`) validates: prompt length (max 50k chars), model whitelist, max_tokens (100-4000), temperature (0-1).

## File layout

| File | Purpose |
|------|---------|
| `index.html` | Public landing page with 3 service cards |
| `login.html` | Login/register page with inline Firebase Auth JS |
| `assessment.html` | CE assessment form markup (7 control sections, modals) |
| `assessment.js` | CE assessment logic: auto-save, branching, collection, validation, analysis, results, PDF, vendors |
| `assessment.css` | CE assessment styling including print rules and responsive breakpoints |
| `caf-assessment.html` | CAF assessment form markup |
| `caf-assessment.js` | CAF assessment logic |
| `caf-assessment.css` | CAF assessment styling |
| `firebase-config.js` | Firebase project config (public client-side keys) |
| `api/analyze.js` | Vercel serverless function proxying to Claude API |
| `api/hello.js` | Health-check endpoint (returns `{ ok: true }`) |
| `vercel.json` | CORS headers for `/api/*` routes |
| `package.json` | Node engine constraint for Vercel (>=18) |
| `RELEASE_NOTES.md` | Per-version release notes |
| `CHANGELOG.md` | Chronological changelog |
| `CONTRIBUTING.md` | Contribution guidelines |
| `DEPLOYMENT_GUIDE.md` | Vercel deployment instructions |
| `EDITING_QUESTIONS_GUIDE.md` | Guide for editing assessment questions |
| `QUICK_START.md` | Quick-start guide |
