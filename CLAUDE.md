# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cyber Essentials Readiness Checker — a client-side web app that evaluates an organisation's readiness for UK Cyber Essentials v3.3 certification. Pure HTML/CSS/vanilla JS with no build step; a single Vercel serverless function proxies requests to the Claude API.

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
index.html          Landing page — 3 service cards (free CE, enhanced CE, CAF)
   ↓ click card
login.html          Login/registration (Firebase Auth, MFA)
   ↓ redirect (reads ?redirect= param)
assessment.html     Assessment UI — 7 collapsible sections
assessment.js       All application logic (single ~2000-line file)
assessment.css      All styles
firebase-config.js  Public Firebase SDK config
api/analyze.js      Vercel serverless proxy → Claude API
```

### How the app works

1. **Landing page** — `index.html` is a public landing page with 3 service cards. Clicking the free CE card navigates to `login.html?redirect=assessment`.

2. **Auth** — `login.html` handles login/registration/MFA via Firebase Auth SDK (loaded from CDN). Reads `?redirect=` param (whitelisted) to determine post-auth destination. On success, redirects to the target page.

3. **Assessment** — 6 core Cyber Essentials controls (firewalls, secure config, updates, access control, malware, scope) plus an optional 7th supply chain section. Each control has multiple-choice questions (radio buttons with `data-control` attribute mapping to controls 1-6) and required free-text fields.

4. **Conditional branching** — Some questions are shown/hidden based on parent answers. Hidden question answers are auto-cleared to avoid stale scoring.

5. **Supply chain** — Optional vendor assessment module. Vendors are added dynamically; each gets 8 weighted security questions rendered in `.vendor-question` divs. Vendor radios do NOT have `data-control` attributes (important: `collectResponses()` must skip them).

6. **Auto-save** — All state (radio selections, text inputs, vendors) saves to `localStorage` every 1 second via debounce.

7. **Analysis** — Two paths:
   - **Primary**: `analyzeWithProxy()` sends responses + system prompt to `/api/analyze` → Claude API → structured JSON result.
   - **Fallback**: `performLocalAnalysis()` scores locally in JS if the API is unavailable.

8. **Results display** — `displayResults()` builds the results DOM (XSS-safe via `escapeHtml()` and `document.createElement`). Includes radar chart, heatmap, score bars, vendor risk table, critical issues, and next steps.

9. **PDF export** — `printToPDF()` prompts for company name, adds header/appendix, then calls `window.print()`.

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
| `assessment.js` | Core logic: auto-save, branching, collection, validation, analysis, results, PDF, vendors |
| `assessment.html` | Assessment form markup (7 control sections, modals) |
| `assessment.css` | All styling including print rules and responsive breakpoints |
| `index.html` | Public landing page with 3 service cards |
| `login.html` | Login/register page with inline Firebase Auth JS |
| `firebase-config.js` | Firebase project config (public client-side keys) |
| `api/analyze.js` | Vercel serverless function proxying to Claude API |
| `vercel.json` | CORS headers for `/api/*` routes |
| `RELEASE_NOTES.md` | Per-version release notes |
| `CHANGELOG.md` | Chronological changelog |
