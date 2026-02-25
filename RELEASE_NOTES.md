# Release Notes

## v2.0.0 - 2026-02-25

### CAF Self-Assessment Tool

New standalone assessment implementing the **NCSC Cyber Assessment Framework v4.0**, covering all 4 objectives, 14 principles, and 41 contributing outcomes across **83 questions**.

#### Framework coverage

| Objective | Principles | Questions |
|-----------|-----------|-----------|
| A — Managing Security Risk | A1 Governance, A2 Risk Management, A3 Asset Management, A4 Supply Chain | 17 |
| B — Protecting Against Cyber Attack | B1 Policies & Processes, B2 Identity & Access Control, B3 Data Security, B4 System Security, B5 Resilient Networks & Systems, B6 Staff Awareness & Training | 36 |
| C — Detecting Cyber Security Events | C1 Security Monitoring, C2 Proactive Discovery | 16 |
| D — Minimising Impact of Incidents | D1 Response & Recovery Planning, D2 Lessons Learned | 14 |

Questions are grouped under labelled outcomes (e.g. A1.a Board Direction, C1.e Threat Intelligence) with contextual help text. Each question uses a 4-point rating: **Achieved** (100), **Partially Achieved** (50), **Not Achieved** (0), and **Not Applicable** (excluded).

#### Scoring methodology

- Per-principle score = average of question scores (N/A answers excluded)
- Objective rating = average of its principle scores
- Overall CAF readiness % = average of all 14 principle scores
- Rating thresholds: ≥70% Achieved, 40–69% Partially Achieved, <40% Not Achieved

#### Sector selector

Dropdown at the top of the assessment with 12 UK sectors (energy, transport, health, water, digital infrastructure, digital services, finance, government, defence, education, telecoms, other). Selection is persisted to `localStorage` and:

- Injected into the Claude API analysis prompt so the AI-generated regulatory note is tailored to the organisation's specific regime (NIS Regulations, DORA, TSA, GovAssure, etc.)
- Used by the local fallback to return a sector-specific compliance note mapping to the correct Competent Authority (Ofgem, Ofcom, DWI, FCA/PRA, DHSC, etc.)

#### Real-time progress tracker

- SVG progress ring showing overall completion percentage with smooth stroke animation
- 14 principle rows with colour-coded badges: gray (untouched) → blue (started) → orange (≥50%) → green (complete)
- Clickable rows scroll to the corresponding section
- Sticky sidebar on desktop; stacked above content on mobile

#### Ask Oracle

Per-question "Ask Oracle" button that sends the question text, principle context, and help text to the Claude API proxy, returning 3–5 bullet points of NCSC-aligned CAF guidance. Button toggles to show/hide the response; loading and error states handled inline.

#### AI-powered analysis

- **Primary path**: `buildAnalysisPrompt()` sends principle scores, section-level detail, sector context, and a strict JSON schema to `/api/analyze` → Claude returns structured result with `overallRating`, `summary`, `criticalGaps`, `strengths`, `priorityActions` (each tagged to the correct principle), `objectiveRatings`, and `regulatoryNote`
- **Fallback path**: `buildFallbackResult()` computes the same structure locally when the API is unavailable, including sector-aware regulatory notes via `buildRegulatoryNote()`
- Minimum 10 answered questions required before analysis runs
- Prompt includes explicit principle-tagging rules (e.g. SIEM/logging → C1, threat hunting → C2, incident response → D1) to prevent mis-categorisation

#### Results display

- Overall score card with colour-coded rating (green/orange/red)
- Objective ratings row (A/B/C/D chips with colour-matched borders)
- **14-axis radar chart** — pure-JS SVG polar chart with grid rings at 25/50/75/100%, a dashed red 70% benchmark polygon, filled teal data polygon, colour-coded data dots, and pushed-out axis labels
- **Section score grid** — 14 cards in a responsive 4-column layout with animated progress bars
- Critical gaps, priority actions, and strengths lists with badge styling
- Sector-specific regulatory note

#### PDF export

- Modal prompts for organisation name
- Executive summary section (print-only): gradient header bar, large score readout, objective chips, and top 3 critical gaps
- A4 print stylesheet with colour preservation, page-break rules, and generated-date footer
- Executive summary page-breaks before the full results

#### JSON export

- Downloads `caf-assessment-YYYY-MM-DD.json` containing timestamped scores and all responses for archival or comparison

#### Auto-save

- Debounced `localStorage` sync every 800ms on any answer change
- Sector selection, radio states, and save timestamp all persisted
- Session restored on page load with "Restored" notice
- Manual "Save Progress" button with animated feedback (saving → saved)
- "Clear All" with confirmation dialog

#### Design & layout

- Indigo/navy theme (`--primary: #1a3a5c`, `--accent: #00a878` teal) distinct from the green CE assessment theme
- CSS Grid: 260px sticky sidebar + fluid content area on desktop; single-column stack on mobile with fixed bottom action bar
- Pill-shaped radio buttons that fill with their rating colour when selected (green/orange/red/gray)
- Outcome group headers with light-blue backgrounds
- Collapsible sections with toggle icons
- System font stack, consistent type scale (headers 1.6rem → body 0.9rem → small 0.72rem)
- Print-optimised with `@media print` rules: A4 margins, hidden chrome, colour-adjust exact, page-break protection on cards

#### New files

| File | Purpose |
|------|---------|
| `caf-assessment.html` | Assessment form: 83 questions across 14 sections, welcome modal, progress sidebar, results overlay, sector selector |
| `caf-assessment.js` | All application logic: auto-save, scoring, progress tracker, Ask Oracle, analysis prompt, fallback, results rendering, radar chart, PDF/JSON export, sector helpers |
| `caf-assessment.css` | Indigo-themed stylesheet with responsive grid, print rules, and radar chart styling |

### Landing Page Update

- `index.html` converted to a landing page with 3 service cards: free Cyber Essentials checker, enhanced CE assessment, and CAF self-assessment
- Page title renamed from "Cyber 3D" to "Cyber Assessment Hub"

---

## v1.5.0 - 2026-02-22

### Supply Chain Vendor Assessment
- New Supply Chain section (Control 7) for organisations that use third-party vendors or managed service providers
- Two-step welcome modal introduces the section before it is shown; choice persisted to `localStorage` so it isn't repeated
- Add unlimited vendors via "Add Vendor" cards; each vendor gets its own collapsible card with a dedicated set of supply-chain security questions
- Vendor answers are collected separately from the six core CE controls and included in the full analysis output
- Section is fully optional — toggling it off hides the vendor cards without affecting the main assessment score

### Bug Fix — Analyze button non-responsive with supply chain enabled
- `collectResponses()` queried all checked radio buttons on the page, including vendor radios generated inside `.vendor-question` divs
- When no matching `.question` ancestor existed, `radio.closest('.question')` returned `null`, and the subsequent `question.dataset.control` access threw a `TypeError` that crashed `analyzeAssessment()` before any UI feedback appeared
- Fixed by adding a null-guard that skips any radio not inside a `.question[data-control]` element, confining collection to the six core CE control radios

---

## v1.4.0 - 2026-02-20

### Risk Overview Dashboard
- New radar/spider chart in the results section showing all 5 control scores at a glance as an SVG visualisation
- Color-coded heatmap grid with per-control status indicators: On Track (green), Needs Work (yellow), At Risk (red)
- Inserted between the assessment summary and detailed control score bars for an immediate visual overview
- Fully responsive layout (side-by-side on desktop, stacked on mobile)
- Print-safe with forced color rendering for PDF exports

### Smart Question Branching
- 5 conditional follow-up questions that appear only when a parent answer triggers them:
  - Firewall config unknown → "Had a professional firewall audit?"
  - Unnecessary software not fully removed → "Maintain a software inventory?"
  - Unsupported software in use → "Plan to replace within 3 months?"
  - MFA not on all cloud services → "Which services lack MFA?" (free-text)
  - BYOD in use → "How are personal devices secured?"
- Hidden questions are excluded from completion percentage calculations
- Answers automatically cleared when a question is hidden (no stale data in scoring)
- Branching state correctly restored when loading a saved assessment
- Visually distinguished with dashed teal border and indentation

### Ask Oracle Expansion
- "Need help? Ask Oracle" button now available on all 29 radio-option questions (previously only on the first question)
- Text/number input fields excluded as Oracle guidance is only relevant for multiple-choice questions

---

## v1.3.0 - 2026-02-19

### Ask Consultant
- New "Ask Consultant" button on assessment questions providing real-time Cyber Essentials guidance powered by Claude
- Dedicated system prompt for UK Cyber Essentials v3.3 certification advice
- Response caching to avoid repeat API calls for the same question
- Actual error messages surfaced to the user instead of generic failures

### API & Deployment
- Serverless API proxy deployed to Vercel with CORS and OPTIONS preflight handling
- Frontend API calls updated to use absolute Vercel URL (site hosted on GitHub Pages, API on Vercel)
- Edge-level CORS headers configured in `vercel.json`
- GET health-check endpoint added for debugging (`/api/analyze`)

### Authentication
- Added SMS multi-factor authentication to the login page
- Fixed missing email verification on user registration

### UI Improvements
- First-visit welcome modal on the assessment page (dismissible, shown once)
- "How This Works" button moved inline next to subtitle text

---

## v1.2.0 - 2026-02-17

### Input Validation
- Added required-field validation for all 7 free-text inputs (firewall details, outdated software, anti-malware details, device count, cloud services, backup procedures, incident response)
- Users can no longer submit the assessment with blank free-text answers
- Red border and inline error message displayed on empty fields at submission
- Auto-scrolls to the first empty field and expands its collapsed section
- Errors clear in real-time as the user types
- Red asterisk (`*`) indicators on all required free-text questions

---

## v1.1.0 - 2026-02-16

### Architecture Refactor
- Split monolithic single-file HTML into separate `assessment.html`, `assessment.css`, and `assessment.js` files
- Added XSS-safe DOM manipulation throughout results rendering (replaced `innerHTML` with `createElement`/`textContent`)
- Added `escapeHtml()` sanitisation utility
- Introduced server-side API proxy (`api/analyze`) to keep the Anthropic API key off the client

### Auto-Save & Progress Management
- Integrated auto-save with 1-second debounce on every answer change
- Save / Load / Clear buttons with localStorage persistence
- Resume notification on page load when a saved assessment is found

### AI Analysis Improvements
- Added dedicated system prompt for Claude with strict assessment rules
- Human-readable context passed to the AI (control labels, text input details)
- Structured JSON response format with control scores, critical issues, warnings, strengths, and next steps

### PDF Report
- "Save as PDF" workflow with company name modal and print-dialog instructions
- Company name header injected into the results before printing
- Appendix section automatically generated from all filled text inputs (firewall details, anti-malware software, backup procedures, incident response, cloud services, device count, outdated software)
- Clean printed output: browser URL/header/footer removed via `@page { margin: 0 }` and `a[href]::after { content: none }`
- Page-break protection on all atomic content boxes (summary, score cards, issue items, warning items, recommendation items, appendix items)
- Appendix starts on a new page in print

### Firebase Authentication
- Login page (`index.html`) with Firebase Auth
- Auth state listener redirects unauthenticated users
- User display name shown in the assessment header
- Logout button with confirmation

### Branding
- "Powered by Cyber 3D" branding throughout
- Custom header and title styling
- Logout button repositioned to top-right

### Security
- Removed backup file that contained duplicate Firebase credentials
- All user-supplied text rendered via `textContent` (no raw HTML injection)

---

## v1.0.0 - 2026-02-09

### Initial Release
- 30+ assessment questions covering all 5 Cyber Essentials (v3.3) technical controls:
  1. Firewalls (5 questions + infrastructure details)
  2. Secure Configuration (5 questions)
  3. Security Update Management (5 questions)
  4. User Access Control (6 questions)
  5. Malware Protection (4 questions + software details)
  6. Scope & Context (7 questions including backup and incident response)
- AI-powered analysis via Claude API with automatic local fallback
- Comprehensive results dashboard: overall readiness score, per-control scores, critical issues, warnings, strengths, next steps, and timeline estimate
- Privacy-first client-side architecture (no server storage)
- Responsive design for mobile, tablet, and desktop
- Interactive collapsible control sections with visual progress tracking
- Zero external dependencies (pure HTML/CSS/JavaScript)
- Complete documentation suite: Quick Start, Deployment Guide, Question Editing Guide, Contributing Guide
