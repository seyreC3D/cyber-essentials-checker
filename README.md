# 🛡️ Cyber Assessment Hub

AI-powered, interactive assessment tools to evaluate your organisation's readiness for UK Cyber Essentials (v3.3) certification and the NCSC Cyber Assessment Framework (CAF v4.0).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firebase Hosting](https://img.shields.io/badge/demo-live-brightgreen)](https://cyber-essentials-checker.web.app/)

## 🚀 Quick Start

**Try it now:** [Live Demo](https://cyber-essentials-checker.web.app/)

**Or run locally:**
```bash
# Clone the repository
git clone https://github.com/yourusername/cyber-essentials-checker.git

# Open in browser
cd cyber-essentials-checker
open index.html  # macOS
# or
start index.html  # Windows
# or
xdg-open index.html  # Linux
```

No installation, no dependencies, no backend required!

## 📋 Features

### ✅ Cyber Essentials Readiness Checker (Free)
- **30+ questions** covering all 5 Cyber Essentials v3.3 technical controls
- Firewalls, Secure Configuration, Security Updates, User Access Control, Malware Protection
- Additional questions on backups and incident response
- Collects detailed infrastructure information (firewall models, antivirus versions)
- **Required-field validation** prevents blank free-text answers essential for the assessor

### 🏛️ NCSC CAF Self-Assessment (Free)
- **83 questions** covering all 4 objectives, 14 principles, and 41 contributing outcomes of CAF v4.0
- Four-tier rating per question: Achieved, Partially Achieved, Not Achieved, Not Applicable
- Principle-level scoring with overall readiness percentage
- "Ask Oracle" contextual guidance for every question using the Claude API
- Collapsible objective/principle navigation with real-time progress tracking
- AI-powered analysis with structured maturity report and gap identification

### 🤖 AI-Powered Analysis
- **Claude API integration** via server-side proxy (API key never exposed to the client)
- **Fallback local analysis** works without internet
- Structured system prompt with strict assessment rules
- Identifies critical failures that prevent certification
- Provides actionable recommendations

### 📊 Detailed Results
- Overall readiness score (0-100%)
- Individual scores for each control
- Pass/Fail/Needs Work determination
- Timeline estimate for certification readiness
- Prioritized list of critical issues
- Specific remediation steps

### 📄 PDF Report Export
- Professional PDF output with company name header and generation date
- Appendix with full infrastructure and configuration details
- Clean print layout with no browser URLs or headers
- Page-break protection keeps content boxes intact

### 💾 Auto-Save & Progress Management
- Auto-saves progress with every answer change
- Manual Save / Load / Clear buttons
- Resume notification on page load when a saved assessment exists
- All data stored locally in the browser (localStorage)

### 🔒 Privacy & Security
- **Client-side architecture** - assessment data stays in your browser
- Firebase Authentication for access control
- XSS-safe DOM rendering throughout (no raw HTML injection)
- Server-side API proxy keeps the AI key off the client
- GDPR compliant by design

### 📱 Modern UI
- Responsive design (works on mobile, tablet, desktop)
- Interactive collapsible sections
- Visual progress tracking
- Real-time input validation with inline error messages
- Print-friendly results

## 🎯 Who Is This For?

- **Small businesses** preparing for Cyber Essentials certification
- **Operators of essential services** assessing CAF compliance
- **IT consultants** assessing client security posture
- **Certification bodies** providing pre-assessment tools
- **Internal IT teams** conducting security audits
- **MSPs** evaluating new client environments

## 📖 Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running in 5 minutes
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Detailed deployment options
- **[Editing Questions](docs/EDITING_QUESTIONS_GUIDE.md)** - Customize the assessment
- **[New Questions Summary](docs/NEW_QUESTIONS_SUMMARY.md)** - Recent additions
- **[Release Notes](RELEASE_NOTES.md)** - Version history and what's new

## 🏗️ Architecture

```
┌──────────────┐       ┌──────────────────────────────┐
│  index.html  │       │     Firebase Auth (v10.7.1)   │
│ Landing page │       │  Email/password, Google OAuth │
└──────┬───────┘       │  TOTP MFA (authenticator app) │
       │               └──────────────┬───────────────┘
       ▼                              │
┌──────────────┐    login / register  │
│  login.html  │◄────────────────────►│
└──────┬───────┘                      │
       │ redirect (?redirect=)        │
       ▼                              │
┌──────────────────────┐    onAuthStateChanged
│  assessment.html     │◄─────────────┘
│  caf-assessment.html │
└──────────┬───────────┘
           │
           ├─── Local Analysis (always available)
           │
           └─── /api/analyze ──▶ Vercel Proxy ──▶ Claude API
                                                    ↓
                                              AI-powered report
```

**Firebase services used:** Authentication only (email/password, Google Sign-In, TOTP MFA).
No Firestore, Realtime Database, Storage, Cloud Functions, or Analytics.

**Tech Stack:**

| Layer | Technology | Version / Detail |
|-------|-----------|-----------------|
| **Frontend** | HTML5 / CSS3 / Vanilla JavaScript | No frameworks, no build step |
| **Fonts** | Google Fonts — Inter | Weights 400–800, loaded via CDN |
| **Authentication** | Firebase Auth SDK (ESM) | v10.7.1, loaded from `gstatic.com` CDN |
| **Auth methods** | Email/password, Google Sign-In, TOTP MFA | Via Firebase `multiFactor` + `TotpMultiFactorGenerator` |
| **QR codes** | QRious | v4.0.2, used for TOTP MFA enrolment QR generation |
| **AI analysis** | Anthropic Claude API | Messages API v2023-06-01; models: `claude-sonnet-4-5-20250929`, `claude-haiku-4-5-20251001` |
| **API proxy** | Firebase Cloud Function (Node.js ≥ 18) | `functions/analyze.js` — keeps `ANTHROPIC_API_KEY` server-side |
| **Hosting** | Firebase Hosting | `cyber-essentials-checker.web.app` — static files + Cloud Function rewrites |
| **Persistence** | Browser localStorage | Auto-save every 1 s; keys listed in CLAUDE.md |
| **PDF export** | Native `window.print()` | Custom `@media print` CSS for clean output |

## 📦 What's Included

```
cyber-essentials-checker/
├── index.html                    # Landing page with service cards
├── login.html                    # Login/registration (Firebase Auth, MFA)
├── assessment.html               # Cyber Essentials assessment form
├── assessment.css                # CE assessment styles
├── assessment.js                 # CE assessment logic, validation, PDF export
├── caf-assessment.html           # NCSC CAF self-assessment form (83 questions)
├── caf-assessment.css            # CAF assessment styles
├── caf-assessment.js             # CAF assessment logic, scoring, analysis
├── firebase-config.js            # Firebase project configuration
├── functions/                     # Firebase Cloud Functions (API proxy for Claude)
├── README.md                     # This file
├── RELEASE_NOTES.md              # Version history and release notes
├── CHANGELOG.md                  # Changelog
├── LICENSE                       # MIT License
└── docs/
    ├── QUICK_START.md            # Fast deployment guide
    ├── DEPLOYMENT_GUIDE.md       # Comprehensive deployment
    ├── EDITING_QUESTIONS_GUIDE.md # Customization guide
    └── NEW_QUESTIONS_SUMMARY.md  # Recent additions
```

## 🚢 Deployment Options

### Option 1: Firebase Hosting (Recommended)
```bash
1. Install Firebase CLI: npm install -g firebase-tools
2. Log in: firebase login
3. Set API key: firebase functions:secrets:set ANTHROPIC_API_KEY
4. Deploy: firebase deploy
5. Your URL: https://cyber-essentials-checker.web.app/
```

### Option 2: Your Website
```bash
# Just upload index.html to your web server
cp index.html /var/www/html/cyber-essentials/
```

See [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for more options.

## 🎨 Customization

### Change Branding
```html
<!-- Edit index.html -->
<h1>🛡️ [Your Company] Cyber Essentials Checker</h1>
```

### Modify Colors
```css
/* Edit the CSS section */
background: linear-gradient(135deg, #YOUR_COLOR1 0%, #YOUR_COLOR2 100%);
```

### Add Questions
See [EDITING_QUESTIONS_GUIDE.md](docs/EDITING_QUESTIONS_GUIDE.md) for detailed instructions.

### Add Save Feature
```bash
# Instructions in docs/add_save_feature.js
```

## 📊 Sample Questions

The assessment covers:

**Firewalls**
- Are all devices protected by firewalls?
- Have default passwords been changed?
- What firewall models are in use?

**Security Updates**
- Is all software licensed and supported?
- Are automatic updates enabled?
- Critical updates applied within 14 days?

**Access Control**
- Multi-factor authentication on cloud services?
- Unique accounts for each user?
- Strong password policies?

**Plus:** Malware protection, secure configuration, backups, incident response

## 🔧 Configuration

### Enable AI Analysis
The tool works standalone, but you can enable Claude API for enhanced analysis:

```javascript
// AI analysis happens automatically if the API is accessible
// No configuration needed - it falls back to local analysis if unavailable
```

### Disable AI Analysis
```javascript
// Comment out the analyzeWithClaude function call
// Tool will use local analysis only
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Ideas for Contributions
- [ ] Additional question templates
- [ ] Industry-specific variants (healthcare, finance, etc.)
- [x] Export to PDF functionality
- [ ] Results comparison over time
- [x] Integration with NCSC CAF framework
- [ ] Integration with other frameworks (ISO 27001, NIST)
- [ ] Translations to other languages
- [ ] Mobile app wrapper

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is for **assessment purposes only** and does not constitute official Cyber Essentials certification. 

- This is NOT a replacement for official certification
- Results are indicative only
- Final certification must be obtained from a Certification Body
- Cyber Essentials requirements may change - check official NCSC guidance

## 🙏 Acknowledgments

- **UK NCSC** for the Cyber Essentials scheme
- **Anthropic** for Claude API
- **Open source community** for inspiration and tools

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/cyber-essentials-checker/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/cyber-essentials-checker/discussions)
- **Email:** your-email@example.com

## 🗺️ Roadmap

- [x] Core assessment functionality
- [x] AI-powered analysis with server-side proxy
- [x] Infrastructure inventory questions
- [x] Backup and IR questions
- [x] Firebase Authentication
- [x] Auto-save and progress management
- [x] PDF report export with appendix
- [x] Input validation for required fields
- [x] XSS-safe rendering and security hardening
- [x] NCSC CAF v4.0 self-assessment (83 questions, 14 principles)
- [ ] Multi-language support
- [ ] Historical tracking
- [ ] Team collaboration features
- [ ] API for integration

## 📈 Stats

- **Dependencies:** 0 runtime (pure vanilla JS) + Firebase Auth SDK
- **Browser Support:** All modern browsers
- **Assessment Time:** 15-20 minutes (CE), 30-45 minutes (CAF)

## 🌟 Star History

If you find this tool useful, please consider giving it a star! ⭐

## 📸 Screenshots

### Assessment Interface
![Assessment Interface](https://via.placeholder.com/800x400?text=Assessment+Interface)

### Results Dashboard
![Results Dashboard](https://via.placeholder.com/800x400?text=Results+Dashboard)

### Mobile View
![Mobile View](https://via.placeholder.com/400x800?text=Mobile+View)

---

**Made with ❤️ for the cybersecurity community**

*Helping small businesses achieve Cyber Essentials certification, one assessment at a time.*
