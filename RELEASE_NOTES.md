# Release Notes

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
