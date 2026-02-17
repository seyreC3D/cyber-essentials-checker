# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-02-17

### Added
- Required-field validation for all 7 free-text inputs
- Red asterisk indicators on required questions
- Inline error messages and red border on empty fields at submission
- Auto-scroll and section expansion to the first invalid field
- Real-time error clearing as the user types

---

## [1.1.0] - 2026-02-16

### Added
- Separated monolithic HTML into `assessment.html`, `assessment.css`, and `assessment.js`
- Server-side API proxy (`/api/analyze`) to keep Anthropic key off the client
- XSS-safe DOM rendering (replaced innerHTML with createElement/textContent)
- Auto-save with 1-second debounce on every answer change
- Save / Load / Clear buttons with localStorage persistence
- Resume notification on page load
- Structured system prompt for Claude with strict Cyber Essentials rules
- PDF report export with company name header and print-dialog instructions
- Appendix section in PDF with all infrastructure and configuration details
- Page-break protection on all atomic content boxes
- Firebase Authentication with login page, auth state listener, and logout
- "Powered by Cyber 3D" branding

### Fixed
- Removed browser URL/header/footer from printed PDF output
- Removed backup file containing duplicate Firebase credentials
- Prevented Assessment Summary box from splitting across pages

### Security
- All user-supplied text rendered via textContent (no raw HTML injection)
- escapeHtml() utility for any remaining cases

---

## [1.0.0] - 2026-02-09

### Added
- Initial release of Cyber Essentials Readiness Checker
- 30+ assessment questions covering all 5 technical controls
- AI-powered analysis using Claude API
- Local fallback analysis when AI unavailable
- Firewall model and version collection
- Malware protection software version collection
- Backup procedure assessment questions
- Incident response planning questions
- Responsive UI with collapsible sections
- Real-time visual feedback on selections
- Comprehensive results dashboard with:
  - Overall readiness score
  - Individual control scores
  - Critical issues identification
  - Actionable recommendations
  - Timeline estimates
- Privacy-first architecture (client-side only)
- Complete documentation suite
- GitHub Pages deployment ready

### Technical Controls Covered
1. **Firewalls** (5 questions + infrastructure details)
2. **Secure Configuration** (5 questions)
3. **Security Update Management** (5 questions)
4. **User Access Control** (6 questions)
5. **Malware Protection** (4 questions + software details)
6. **Scope & Context** (7 questions including backup and IR)

### Documentation
- Quick Start Guide
- Comprehensive Deployment Guide
- Question Editing Guide
- GitHub Upload Instructions
- Feature Addition Guide (save/load)

### Features
- Zero dependencies (pure HTML/CSS/JavaScript)
- No backend required
- Works offline (except AI analysis)
- Mobile responsive
- Print-friendly results
- Export capabilities (print, screenshot)
- Customizable branding
- Extensible question system

---

## Future Releases

### [1.3.0] - Planned
- [ ] Multi-language support
- [ ] Industry-specific question variants
- [ ] Results comparison over time
- [ ] Email results to IT team

### [2.0.0] - Future
- [ ] Team collaboration features
- [ ] Historical tracking dashboard
- [ ] Automated remediation tracking
- [ ] Integration with security tools
- [ ] Mobile app version

---

## Version History

- **v1.2.0** (2026-02-17): Input validation for required free-text fields
- **v1.1.0** (2026-02-16): Architecture refactor, auto-save, PDF export, Firebase Auth, security hardening
- **v1.0.0** (2026-02-09): Initial public release
