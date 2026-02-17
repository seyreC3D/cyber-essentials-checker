// =============================================
// assessment.js - Main application logic
// =============================================

// --- XSS Sanitization Utility ---
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// --- Toggle control sections ---
function toggleControl(num) {
    const content = document.getElementById(`content-${num}`);
    const toggle = document.getElementById(`toggle-${num}`);
    content.classList.toggle('expanded');
    toggle.classList.toggle('expanded');
}

// Expand all controls on load
window.addEventListener('load', () => {
    for (let i = 1; i <= 6; i++) {
        toggleControl(i);
    }
    initAutoSave();
});

// --- Handle option selection ---
document.querySelectorAll('.option').forEach(option => {
    option.addEventListener('click', function () {
        const radio = this.querySelector('input[type="radio"]');
        radio.checked = true;

        const name = radio.name;
        document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
            r.parentElement.classList.remove('selected', 'fail');
        });

        this.classList.add('selected');
        if (radio.value === 'fail') {
            this.classList.add('fail');
        }

        // Trigger auto-save on every answer change
        debouncedAutoSave();
    });
});

// Also auto-save when text inputs change
document.querySelectorAll('.text-input').forEach(input => {
    input.addEventListener('input', debouncedAutoSave);
});

// =============================================
// AUTO-SAVE FEATURE
// =============================================
const AUTOSAVE_KEY = 'cyber-essentials-assessment';
let autoSaveTimer = null;

function debouncedAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(autoSave, 1000);
}

function autoSave() {
    try {
        const responses = collectResponses();
        const saveData = {
            responses: responses,
            timestamp: new Date().toISOString(),
            version: '1.1'
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(saveData));
        showAutoSaveIndicator();
    } catch (e) {
        // Silently fail — localStorage might be full or disabled
    }
}

function showAutoSaveIndicator() {
    let indicator = document.getElementById('autosave-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'autosave-indicator';
        indicator.style.cssText = `
            position: fixed; bottom: 20px; right: 20px;
            background: #028090; color: white;
            padding: 8px 16px; border-radius: 6px;
            font-size: 13px; opacity: 0; transition: opacity 0.3s;
            z-index: 9999; pointer-events: none;
        `;
        document.body.appendChild(indicator);
    }
    indicator.textContent = 'Progress saved';
    indicator.style.opacity = '1';
    setTimeout(() => { indicator.style.opacity = '0'; }, 1500);
}

function saveAssessment() {
    autoSave();
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = 'Saved!';
        saveBtn.style.background = '#28a745';
        saveBtn.style.color = 'white';
        setTimeout(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.style.background = '';
            saveBtn.style.color = '';
        }, 2000);
    }
}

function loadAssessment() {
    try {
        const saved = localStorage.getItem(AUTOSAVE_KEY);
        if (!saved) {
            alert('No saved assessment found.');
            return;
        }

        const saveData = JSON.parse(saved);
        const responses = saveData.responses;

        // Restore radio button selections
        Object.keys(responses.controls).forEach(control => {
            Object.entries(responses.controls[control]).forEach(([questionId, answer]) => {
                const radio = document.querySelector(`input[name="${questionId}"][value="${answer.value}"]`);
                if (radio) {
                    radio.checked = true;
                    radio.parentElement.classList.add('selected');
                    if (answer.value === 'fail') {
                        radio.parentElement.classList.add('fail');
                    }
                }
            });
        });

        // Restore text inputs
        const textMap = {
            outdatedSoftware: 'q3_5',
            deviceCount: 'q6_4',
            cloudServices: 'q6_5',
            firewallDetails: 'q1_firewall_details',
            malwareDetails: 'q5_malware_details',
            backupDetails: 'q6_backup_details',
            incidentDetails: 'q6_incident_details'
        };
        Object.entries(textMap).forEach(([key, id]) => {
            if (responses.textInputs[key]) {
                const el = document.getElementById(id);
                if (el) el.value = responses.textInputs[key];
            }
        });

        const savedDate = new Date(saveData.timestamp).toLocaleString();
        alert(`Assessment loaded from ${savedDate}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        alert('Unable to load saved assessment. The data may be corrupted.');
    }
}

function clearSavedAssessment() {
    if (confirm('Are you sure you want to delete your saved assessment? This cannot be undone.')) {
        localStorage.removeItem(AUTOSAVE_KEY);
        alert('Saved assessment deleted.');
    }
}

function initAutoSave() {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved) {
        try {
            const saveData = JSON.parse(saved);
            const savedDate = new Date(saveData.timestamp).toLocaleString();

            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px;
                background: #fff3cd; border: 2px solid #ffc107;
                padding: 15px 20px; border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000; max-width: 350px;
            `;
            notification.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px; color: #856404;">
                    Saved Assessment Found
                </div>
                <div style="font-size: 14px; color: #856404; margin-bottom: 12px;">
                    Last saved: ${escapeHtml(savedDate)}
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="loadAssessment(); this.parentElement.parentElement.remove();"
                            style="flex: 1; padding: 8px; background: #028090; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                        Load
                    </button>
                    <button onclick="this.parentElement.parentElement.remove();"
                            style="flex: 1; padding: 8px; background: white; color: #666; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                        Dismiss
                    </button>
                </div>
            `;
            document.body.appendChild(notification);
        } catch (e) {
            // Corrupted save data, ignore
        }
    }
}

// =============================================
// RESPONSE COLLECTION
// =============================================
function collectResponses() {
    const responses = {
        controls: {
            firewalls: {},
            secureConfig: {},
            updates: {},
            accessControl: {},
            malware: {},
            scope: {}
        },
        textInputs: {}
    };

    document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
        const question = radio.closest('.question');
        const control = question.dataset.control;
        const critical = question.dataset.critical === 'true';

        const controlMap = {
            '1': 'firewalls',
            '2': 'secureConfig',
            '3': 'updates',
            '4': 'accessControl',
            '5': 'malware',
            '6': 'scope'
        };

        const controlName = controlMap[control];
        responses.controls[controlName][radio.name] = {
            value: radio.value,
            critical: critical,
            text: radio.parentElement.textContent.trim()
        };
    });

    responses.textInputs.outdatedSoftware = document.getElementById('q3_5')?.value || '';
    responses.textInputs.deviceCount = document.getElementById('q6_4')?.value || '';
    responses.textInputs.cloudServices = document.getElementById('q6_5')?.value || '';
    responses.textInputs.firewallDetails = document.getElementById('q1_firewall_details')?.value || '';
    responses.textInputs.malwareDetails = document.getElementById('q5_malware_details')?.value || '';
    responses.textInputs.backupDetails = document.getElementById('q6_backup_details')?.value || '';
    responses.textInputs.incidentDetails = document.getElementById('q6_incident_details')?.value || '';

    return responses;
}

// =============================================
// FREE-TEXT VALIDATION
// =============================================
const REQUIRED_TEXT_FIELDS = [
    { id: 'q1_firewall_details', label: 'Firewall solution(s)', control: 1 },
    { id: 'q3_5', label: 'Outdated software list', control: 3 },
    { id: 'q5_malware_details', label: 'Anti-malware software details', control: 5 },
    { id: 'q6_4', label: 'Number of devices in scope', control: 6 },
    { id: 'q6_5', label: 'Cloud services list', control: 6 },
    { id: 'q6_backup_details', label: 'Backup solution description', control: 6 },
    { id: 'q6_incident_details', label: 'Incident response procedures', control: 6 }
];

function validateTextInputs() {
    clearValidationErrors();

    const emptyFields = [];

    REQUIRED_TEXT_FIELDS.forEach(field => {
        const el = document.getElementById(field.id);
        if (!el) return;

        if (!el.value.trim()) {
            emptyFields.push(field);

            el.classList.add('validation-error');

            // Add error message if not already present
            if (!el.parentElement.querySelector('.validation-error-msg')) {
                const msg = document.createElement('div');
                msg.className = 'validation-error-msg';
                msg.textContent = 'This field is required for the assessor.';
                el.parentElement.appendChild(msg);
            }
        }
    });

    return emptyFields;
}

function clearValidationErrors() {
    document.querySelectorAll('.text-input.validation-error').forEach(el => {
        el.classList.remove('validation-error');
    });
    document.querySelectorAll('.validation-error-msg').forEach(el => {
        el.remove();
    });
}

// Clear individual field error on input
document.querySelectorAll('.text-input').forEach(input => {
    input.addEventListener('input', function () {
        if (this.value.trim()) {
            this.classList.remove('validation-error');
            const msg = this.parentElement.querySelector('.validation-error-msg');
            if (msg) msg.remove();
        }
    });
});

// =============================================
// ANALYSIS — MAIN ENTRY POINT
// =============================================
async function analyzeAssessment() {
    const responses = collectResponses();

    const totalQuestions = document.querySelectorAll('.question[data-control]').length;
    const answeredQuestions = Object.keys(responses.controls.firewalls).length +
        Object.keys(responses.controls.secureConfig).length +
        Object.keys(responses.controls.updates).length +
        Object.keys(responses.controls.accessControl).length +
        Object.keys(responses.controls.malware).length +
        Object.keys(responses.controls.scope).length;

    if (answeredQuestions === 0) {
        alert('Please answer at least some questions before analyzing.\n\nYou haven\'t selected any answers yet.');
        return;
    }

    // Validate free-text fields
    const emptyFields = validateTextInputs();
    if (emptyFields.length > 0) {
        const firstEmpty = emptyFields[0];
        const controlContent = document.getElementById(`content-${firstEmpty.control}`);
        if (controlContent && !controlContent.classList.contains('expanded')) {
            toggleControl(firstEmpty.control);
        }
        const firstEl = document.getElementById(firstEmpty.id);
        if (firstEl) {
            firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstEl.focus();
        }

        const fieldNames = emptyFields.map(f => f.label).join('\n  - ');
        alert(
            `Please complete all free-text fields before submitting.\n\n` +
            `The following fields are required:\n  - ${fieldNames}\n\n` +
            `These details are essential for the Cyber Essentials assessor.`
        );
        return;
    }

    const percentComplete = Math.round((answeredQuestions / totalQuestions) * 100);
    if (percentComplete < 50) {
        const proceed = confirm(
            `You've only answered ${answeredQuestions} out of ${totalQuestions} questions (${percentComplete}% complete).\n\n` +
            'For the most accurate assessment, we recommend answering all questions.\n\n' +
            'Do you want to continue with the analysis anyway?'
        );
        if (!proceed) return;
    }

    const resultsDiv = document.getElementById('results');
    const statusIcon = document.getElementById('status-icon');
    const statusTitle = document.getElementById('status-title');
    const statusSubtitle = document.getElementById('status-subtitle');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const resultsContent = document.getElementById('results-content');

    resultsDiv.classList.add('show');
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

    statusIcon.textContent = '';
    statusIcon.className = 'result-status';
    statusTitle.textContent = 'Analyzing Your Responses';
    statusSubtitle.textContent = 'AI is evaluating your Cyber Essentials readiness...';
    resultsContent.innerHTML = '';

    animateProgress(progressFill, progressText, 0, 30, 500);

    try {
        const analysis = await analyzeWithProxy(responses);
        animateProgress(progressFill, progressText, 30, 100, 1000);
        setTimeout(() => {
            displayResults(analysis, statusIcon, statusTitle, statusSubtitle, resultsContent);
        }, 1500);
    } catch (error) {
        statusIcon.textContent = '';
        statusTitle.textContent = 'Using Local Analysis';
        statusSubtitle.textContent = 'AI analysis unavailable — providing assessment based on your responses';
        animateProgress(progressFill, progressText, 30, 100, 500);
        setTimeout(() => {
            const localAnalysis = performLocalAnalysis(responses);
            displayResults(localAnalysis, statusIcon, statusTitle, statusSubtitle, resultsContent);
        }, 1000);
    }
}

// =============================================
// API PROXY — sends requests through server
// =============================================

// Configure the proxy URL here. In production, point this to your
// deployed Firebase Cloud Function, Vercel Edge Function, or similar.
// For local development you can run the included proxy server.
const API_PROXY_URL = '/api/analyze';

async function analyzeWithProxy(responses) {
    const { systemPrompt, userPrompt } = buildAnalysisPrompt(responses);

    try {
        const response = await fetch(API_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userPrompt, systemPrompt: systemPrompt })
        });

        if (!response.ok) {
            throw new Error(`Proxy request failed: ${response.status}`);
        }

        const data = await response.json();

        let analysisText = '';
        if (data.content && Array.isArray(data.content)) {
            const textContent = data.content.find(c => c.type === 'text');
            analysisText = textContent?.text || '';
        } else if (data.text) {
            analysisText = data.text;
        } else if (data.error) {
            throw new Error(`API error: ${data.error.message || JSON.stringify(data.error)}`);
        } else {
            throw new Error('Unexpected API response structure');
        }

        if (!analysisText) {
            throw new Error('No text content in API response');
        }

        return parseClaudeResponse(analysisText, responses);
    } catch (e) {
        // Fall back to local analysis
        return performLocalAnalysis(responses);
    }
}

function buildAnalysisPrompt(responses) {
    const controlLabels = {
        firewalls: 'Firewalls',
        secureConfig: 'Secure Configuration',
        updates: 'Security Update Management',
        accessControl: 'User Access Control',
        malware: 'Malware Protection',
        scope: 'Scope & Context'
    };

    let readableResponses = '';
    Object.entries(responses.controls).forEach(([control, questions]) => {
        readableResponses += `\n### ${controlLabels[control] || control}\n`;
        Object.entries(questions).forEach(([id, answer]) => {
            const status = answer.value.toUpperCase();
            const critical = answer.critical ? ' [CRITICAL]' : '';
            readableResponses += `- ${answer.text} → ${status}${critical}\n`;
        });
    });

    let additionalContext = '';
    const ti = responses.textInputs;
    if (ti.firewallDetails) additionalContext += `\nFirewall solution(s): ${ti.firewallDetails}`;
    if (ti.malwareDetails) additionalContext += `\nAnti-malware solution(s): ${ti.malwareDetails}`;
    if (ti.outdatedSoftware && ti.outdatedSoftware.toLowerCase() !== 'none')
        additionalContext += `\nOutdated software reported: ${ti.outdatedSoftware}`;
    if (ti.cloudServices) additionalContext += `\nCloud services in use: ${ti.cloudServices}`;
    if (ti.deviceCount) additionalContext += `\nDevices in scope: ${ti.deviceCount}`;
    if (ti.backupDetails) additionalContext += `\nBackup procedures: ${ti.backupDetails}`;
    if (ti.incidentDetails) additionalContext += `\nIncident response: ${ti.incidentDetails}`;

    return {
        systemPrompt: buildSystemPrompt(),
        userPrompt: buildUserPrompt(readableResponses, additionalContext)
    };
}

function buildSystemPrompt() {
    return `You are a UK Cyber Essentials (v3.3) certification expert and assessor. Your role is to evaluate small business self-assessment responses against the five technical controls:

1. Firewalls
2. Secure Configuration
3. Security Update Management
4. User Access Control
5. Malware Protection

RULES:
- Only assess based on the answers provided. Do NOT assume or infer capabilities the user has not stated.
- Treat "unsure" or "I don't know" answers as FAILURES — if a business cannot confirm a control is in place, it is not in place.
- Treat "partial" answers as WARNINGS — partially implemented controls need remediation.
- A single critical failure in ANY control means FAIL for that control and overall FAIL for certification.
- Be specific and actionable in recommendations. Reference the exact Cyber Essentials requirement where possible.
- Scoring: 100% = all questions in the control answered "pass". Deduct proportionally for failures. "unsure" on a critical question = 0 points for that question.

IMPORTANT: Return ONLY valid JSON. No markdown fences, no commentary outside the JSON object.`;
}

function buildUserPrompt(readableResponses, additionalContext) {
    return `Evaluate this Cyber Essentials self-assessment:

## Assessment Responses
${readableResponses}
${additionalContext ? `\n## Additional Context\n${additionalContext}` : ''}

Respond with this exact JSON structure:

{
  "overallStatus": "PASS" | "FAIL" | "NEEDS_WORK",
  "readinessScore": <0-100>,
  "criticalIssuesCount": <number>,
  "controlScores": {
    "firewalls": <0-100>,
    "secureConfig": <0-100>,
    "updates": <0-100>,
    "accessControl": <0-100>,
    "malware": <0-100>
  },
  "criticalIssues": [
    {
      "control": "<control key e.g. firewalls, secureConfig, updates, accessControl, malware>",
      "issue": "<what is wrong>",
      "impact": "<business risk and CE requirement reference>",
      "action": "<specific remediation step>"
    }
  ],
  "warnings": [
    {
      "control": "<control key>",
      "warning": "<description>",
      "recommendation": "<actionable fix>"
    }
  ],
  "strengths": ["<strength>"],
  "nextSteps": ["<prioritised step>"],
  "summary": "<2-3 sentence assessment>",
  "timeline": "<estimated time to readiness>"
}`;
}

function parseClaudeResponse(text, responses) {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        // Fall through to local analysis
    }
    return performLocalAnalysis(responses);
}

// =============================================
// LOCAL ANALYSIS (fallback)
// =============================================
function performLocalAnalysis(responses) {
    let criticalFailures = [];
    let warnings = [];
    let strengths = [];
    let scores = {
        firewalls: 100,
        secureConfig: 100,
        updates: 100,
        accessControl: 100,
        malware: 100
    };

    const actionMap = {
        'q1_1': { fail: 'Enable built-in firewalls (Windows Defender Firewall, macOS Firewall) on all devices immediately', impact: 'Without firewalls, devices are exposed to network-based attacks' },
        'q1_2': { fail: 'Change all default passwords on routers and firewalls to strong, unique passwords (12+ characters)', impact: 'Default passwords are publicly known and easily exploited by attackers' },
        'q1_3': { fail: 'Configure firewalls to block all incoming connections by default (deny-all policy)', impact: 'Open firewalls allow attackers easy access to your network' },
        'q2_1': { fail: 'Remove or disable all guest accounts and any unused user accounts', impact: 'Unused accounts are a security risk and potential entry point for attackers' },
        'q2_3': { fail: 'Disable auto-run/auto-execute features in Windows and other operating systems', impact: 'Auto-run can execute malicious files without user permission' },
        'q2_4': { fail: 'Implement authentication requirements before accessing any organizational data or services', impact: 'Unauthenticated access allows anyone to access sensitive business data' },
        'q2_5': { fail: 'Enable screen lock on all devices with a 6+ character password or PIN', impact: 'Unlocked devices can be accessed by anyone with physical access' },
        'q3_1': { fail: 'Replace all unsupported software immediately - this is a critical requirement', impact: 'Unsupported software receives no security updates and is highly vulnerable' },
        'q3_2': { fail: 'Enable automatic updates on all devices and software', impact: 'Without automatic updates, critical security patches may be missed' },
        'q3_3': { fail: 'Establish a process to apply critical/high-risk updates within 14 days of release', impact: 'Delayed patching leaves systems vulnerable to known exploits' },
        'q4_1': { fail: 'Create individual accounts for each user - no shared logins allowed', impact: 'Shared accounts make it impossible to track who did what and prevent accountability' },
        'q4_2': { fail: 'Implement a process to disable/remove accounts immediately when employees leave', impact: 'Former employees with active accounts can access sensitive data they should not have' },
        'q4_3': { fail: 'Enable Multi-Factor Authentication (MFA) on ALL cloud services - this is MANDATORY', impact: 'Without MFA, a single stolen password gives attackers full access to cloud services' },
        'q4_4': { fail: 'Create separate admin accounts used ONLY for administrative tasks', impact: 'Using admin accounts for daily tasks exposes high privileges to malware and phishing' },
        'q4_5': { fail: 'Implement one of the required password policies: MFA + 8 chars, OR 12+ chars, OR 8+ chars with blocklist', impact: 'Weak passwords can be easily guessed or cracked by attackers' },
        'q5_1': { fail: 'Install and activate anti-malware software on all devices OR implement application allow listing', impact: 'Without malware protection, your systems are vulnerable to viruses, ransomware, and other threats' },
        'q5_2': { fail: 'Ensure anti-malware software is enabled and running on all devices', impact: 'Disabled antivirus provides no protection against malware' },
        'q5_3': { fail: 'Enable automatic updates for anti-malware definitions', impact: 'Outdated malware definitions cannot detect new threats' },
        'q6_2': { fail: 'Include ALL cloud services in scope - cloud services cannot be excluded', impact: 'Excluding cloud services leaves a major security gap and violates Cyber Essentials requirements' },
        'q6_backup': { fail: 'Implement automated backup procedures with at least daily backups of critical data', impact: 'Without backups, ransomware attacks or hardware failures could result in permanent data loss' },
        'q6_incident': { fail: 'Create and document an incident response plan covering detection, containment, and recovery procedures', impact: 'Without a plan, security incidents will be handled inconsistently, leading to longer recovery times and greater damage' }
    };

    Object.keys(responses.controls).forEach(control => {
        const controlResponses = responses.controls[control];
        let failCount = 0;
        let totalCritical = 0;

        Object.entries(controlResponses).forEach(([questionId, r]) => {
            if (r.critical) {
                totalCritical++;
                if (r.value === 'fail' || r.value === 'unsure') {
                    failCount++;
                    const actionInfo = actionMap[questionId];
                    criticalFailures.push({
                        control: control,
                        issue: r.text,
                        impact: actionInfo?.impact || 'This is a mandatory requirement for Cyber Essentials certification',
                        action: actionInfo?.fail || 'Implement this control immediately to meet certification requirements'
                    });
                }
            } else if (r.value === 'fail') {
                warnings.push({
                    control: control,
                    warning: r.text,
                    recommendation: 'While not critical, addressing this will strengthen your security posture and improve certification readiness'
                });
            } else if (r.value === 'pass') {
                if (questionId === 'q4_3' || questionId === 'q3_2' || questionId === 'q1_1') {
                    strengths.push(r.text);
                }
            }
        });

        if (totalCritical > 0) {
            scores[control] = Math.max(0, 100 - (failCount / totalCritical * 100));
        }
    });

    const outdatedSoftware = responses.textInputs.outdatedSoftware?.toLowerCase() || '';
    if (outdatedSoftware && outdatedSoftware !== 'none' &&
        (outdatedSoftware.includes('windows 7') || outdatedSoftware.includes('office 2010') ||
            outdatedSoftware.includes('xp') || outdatedSoftware.includes('2003'))) {
        criticalFailures.push({
            control: 'updates',
            issue: `Outdated software identified: ${responses.textInputs.outdatedSoftware}`,
            impact: 'Legacy software no longer receives security updates and must be removed or upgraded',
            action: 'Upgrade to supported versions or remove this software completely from all systems'
        });
    }

    const backupResponse = responses.controls.scope?.['q6_backup'];
    if (backupResponse && backupResponse.value === 'fail') {
        warnings.push({
            control: 'scope',
            warning: 'No regular backup procedure in place',
            recommendation: 'While not required for Cyber Essentials, implementing automated backups is CRITICAL for ransomware recovery and business continuity. Consider cloud backup solutions like Azure Backup, AWS Backup, or Veeam.'
        });
    }

    const incidentResponse = responses.controls.scope?.['q6_incident'];
    if (incidentResponse && incidentResponse.value === 'fail') {
        warnings.push({
            control: 'scope',
            warning: 'No documented incident response plan',
            recommendation: 'Create a simple incident response plan covering: 1) Who to contact, 2) How to isolate affected systems, 3) When to notify authorities, 4) Communication procedures. The NCSC provides free templates.'
        });
    }

    if (backupResponse && backupResponse.value === 'pass') {
        strengths.push('Automated backup procedures in place with documented recovery');
    }
    if (incidentResponse && incidentResponse.value === 'pass') {
        strengths.push('Documented and tested incident response plan');
    }

    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
    const overallStatus = criticalFailures.length === 0 ?
        (warnings.length === 0 ? 'PASS' : 'NEEDS_WORK') : 'FAIL';

    return {
        overallStatus,
        readinessScore: Math.round(avgScore),
        criticalIssuesCount: criticalFailures.length,
        controlScores: scores,
        criticalIssues: criticalFailures,
        warnings: warnings,
        strengths: strengths.length > 0 ? strengths : ['You\'ve started the assessment - that\'s the first step!'],
        nextSteps: generateNextSteps(criticalFailures, warnings),
        summary: generateSummary(overallStatus, criticalFailures.length, avgScore),
        timeline: estimateTimeline(criticalFailures.length, warnings.length)
    };
}

function generateNextSteps(criticalIssues, warnings) {
    const steps = [];
    if (criticalIssues.length > 0) {
        steps.push('Address all critical issues immediately - these will prevent certification');
        steps.push('Focus on the 5 technical controls in priority order');
    }
    if (warnings.length > 0) {
        steps.push('Review and resolve warning items to strengthen security');
    }
    steps.push('Document all security measures and policies');
    steps.push('Contact a Cyber Essentials Certification Body to schedule assessment');
    return steps;
}

function generateSummary(status, criticalCount, score) {
    if (status === 'PASS') {
        return 'Excellent work! Your organization appears ready for Cyber Essentials certification. You\'ve implemented the core controls effectively and should contact a Certification Body to begin the formal assessment process.';
    } else if (status === 'NEEDS_WORK') {
        return 'You\'re on the right track but have some areas to improve. While you\'ve avoided critical failures, addressing the warning items will strengthen your security posture and improve your chances of passing certification.';
    } else {
        return `Your organization has ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} that must be resolved before certification. Focus on implementing the mandatory controls first, then address the remaining gaps. With focused effort, you can achieve certification readiness.`;
    }
}

function estimateTimeline(criticalCount, warningCount) {
    if (criticalCount === 0 && warningCount === 0) return 'Ready now - contact a Certification Body';
    if (criticalCount === 0) return '1-2 weeks to address warnings';
    if (criticalCount <= 3) return '2-4 weeks with focused effort';
    if (criticalCount <= 7) return '1-2 months with dedicated resources';
    return '2-3 months - significant work needed';
}

// =============================================
// DISPLAY RESULTS (XSS-safe)
// =============================================
function animateProgress(fillEl, textEl, start, end, duration) {
    const startTime = Date.now();
    const range = end - start;
    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = start + (range * progress);
        fillEl.style.width = current + '%';
        textEl.textContent = Math.round(current) + '%';
        if (progress < 1) requestAnimationFrame(update);
    }
    update();
}

function displayResults(analysis, statusIcon, statusTitle, statusSubtitle, resultsContent) {
    const statusConfig = {
        'PASS': { icon: '\u2705', title: 'Ready for Certification!', subtitle: 'Your business meets Cyber Essentials requirements', cls: 'pass' },
        'NEEDS_WORK': { icon: '\u26A0\uFE0F', title: 'Almost There', subtitle: 'Some improvements needed before certification', cls: 'partial' },
        'FAIL': { icon: '\u274C', title: 'Not Ready Yet', subtitle: 'Critical issues must be resolved', cls: 'fail' }
    };

    const config = statusConfig[analysis.overallStatus] || statusConfig['FAIL'];
    statusIcon.textContent = config.icon;
    statusIcon.className = 'result-status ' + config.cls;
    statusTitle.textContent = config.title;
    statusSubtitle.textContent = config.subtitle;

    // Build results using DOM manipulation instead of innerHTML for safety
    const fragment = document.createDocumentFragment();

    // --- Score Summary ---
    const scoreSummary = createElement('div', 'score-summary');
    const cards = [
        { value: analysis.readinessScore + '%', label: 'Overall Readiness' },
        { value: String(analysis.criticalIssuesCount), label: 'Critical Issues' },
        { value: String(analysis.warnings?.length || 0), label: 'Warnings' },
        { value: analysis.timeline, label: 'Est. Timeline' }
    ];
    cards.forEach(card => {
        const el = createElement('div', 'score-card');
        const val = createElement('div', 'score-value');
        val.textContent = card.value;
        const lbl = createElement('div', 'score-label');
        lbl.textContent = card.label;
        el.appendChild(val);
        el.appendChild(lbl);
        scoreSummary.appendChild(el);
    });
    fragment.appendChild(scoreSummary);

    // --- Summary Box ---
    const summaryBox = document.createElement('div');
    summaryBox.className = 'summary-box';
    summaryBox.style.cssText = 'background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;';
    const summaryH3 = document.createElement('h3');
    summaryH3.style.cssText = 'margin-bottom: 15px; color: #028090;';
    summaryH3.textContent = 'Assessment Summary';
    const summaryP = document.createElement('p');
    summaryP.style.cssText = 'line-height: 1.6; color: #333;';
    summaryP.textContent = analysis.summary;
    summaryBox.appendChild(summaryH3);
    summaryBox.appendChild(summaryP);
    fragment.appendChild(summaryBox);

    // --- Control Scores ---
    const scoresSection = document.createElement('div');
    scoresSection.style.cssText = 'margin-bottom: 30px;';
    const scoresH3 = document.createElement('h3');
    scoresH3.style.cssText = 'margin-bottom: 15px; color: #028090;';
    scoresH3.textContent = 'Control Scores';
    scoresSection.appendChild(scoresH3);
    scoresSection.appendChild(buildControlScoresDOM(analysis.controlScores));
    fragment.appendChild(scoresSection);

    // --- Critical Issues ---
    if (analysis.criticalIssues && analysis.criticalIssues.length > 0) {
        const issuesSection = createElement('div', 'issues-section');
        const issueCat = createElement('div', 'issue-category');
        const issueH3 = document.createElement('h3');
        issueH3.textContent = 'Critical Issues (Must Fix)';
        issueCat.appendChild(issueH3);

        analysis.criticalIssues.forEach(issue => {
            const item = createElement('div', 'issue-item');

            const title = createElement('div', 'issue-title');
            title.textContent = formatControlName(issue.control);
            item.appendChild(title);

            const desc = createElement('div', 'issue-description');
            desc.textContent = issue.issue || issue.impact;
            item.appendChild(desc);

            const action = createElement('div', 'issue-action');
            const strong = document.createElement('strong');
            strong.textContent = 'Action Required: ';
            action.appendChild(strong);
            action.appendChild(document.createTextNode(issue.action));
            item.appendChild(action);

            issueCat.appendChild(item);
        });
        issuesSection.appendChild(issueCat);
        fragment.appendChild(issuesSection);
    }

    // --- Warnings ---
    if (analysis.warnings && analysis.warnings.length > 0) {
        const warningsSection = document.createElement('div');
        warningsSection.style.cssText = 'margin-bottom: 30px;';
        const warningsH3 = document.createElement('h3');
        warningsH3.style.cssText = 'color: #ffc107; margin-bottom: 15px;';
        warningsH3.textContent = 'Warnings & Recommendations';
        warningsSection.appendChild(warningsH3);

        analysis.warnings.forEach(warning => {
            const warnBox = document.createElement('div');
            warnBox.className = 'warning-item';
            warnBox.style.cssText = 'background: #fff9e6; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 10px; border-radius: 4px;';

            const wTitle = document.createElement('div');
            wTitle.style.cssText = 'font-weight: 600; margin-bottom: 5px;';
            wTitle.textContent = formatControlName(warning.control);
            warnBox.appendChild(wTitle);

            const wDesc = document.createElement('div');
            wDesc.style.cssText = 'font-size: 14px; color: #666;';
            wDesc.textContent = warning.warning;
            warnBox.appendChild(wDesc);

            const wRec = document.createElement('div');
            wRec.style.cssText = 'font-size: 14px; color: #666; margin-top: 5px; font-style: italic;';
            wRec.textContent = warning.recommendation;
            warnBox.appendChild(wRec);

            warningsSection.appendChild(warnBox);
        });
        fragment.appendChild(warningsSection);
    }

    // --- Strengths ---
    if (analysis.strengths && analysis.strengths.length > 0) {
        const strengthsDiv = createElement('div', 'recommendations');
        const sH3 = document.createElement('h3');
        sH3.textContent = 'What You\'re Doing Well';
        strengthsDiv.appendChild(sH3);
        analysis.strengths.forEach(s => {
            const item = createElement('div', 'recommendation-item');
            item.textContent = s;
            strengthsDiv.appendChild(item);
        });
        fragment.appendChild(strengthsDiv);
    }

    // --- Next Steps ---
    const nextDiv = createElement('div', 'recommendations');
    nextDiv.style.marginTop = '20px';
    const nextH3 = document.createElement('h3');
    nextH3.textContent = 'Next Steps';
    nextDiv.appendChild(nextH3);
    analysis.nextSteps.forEach(step => {
        const item = createElement('div', 'recommendation-item');
        item.textContent = step;
        nextDiv.appendChild(item);
    });
    fragment.appendChild(nextDiv);

    // --- Export Buttons ---
    const exportDiv = createElement('div', 'export-buttons');

    const pdfBtn = createElement('button', 'export-button');
    pdfBtn.textContent = 'Save as PDF';
    pdfBtn.addEventListener('click', printToPDF);
    exportDiv.appendChild(pdfBtn);

    const newBtn = createElement('button', 'export-button');
    newBtn.textContent = 'Start New Assessment';
    newBtn.addEventListener('click', () => location.reload());
    exportDiv.appendChild(newBtn);

    fragment.appendChild(exportDiv);

    resultsContent.innerHTML = '';
    resultsContent.appendChild(fragment);
}

function createElement(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
}

function buildControlScoresDOM(scores) {
    const controlNames = {
        firewalls: 'Firewalls',
        secureConfig: 'Secure Configuration',
        updates: 'Security Updates',
        accessControl: 'User Access Control',
        malware: 'Malware Protection'
    };

    const container = document.createDocumentFragment();
    Object.keys(scores).forEach(key => {
        const score = scores[key];
        const color = score >= 80 ? '#28a745' : score >= 60 ? '#ffc107' : '#dc3545';

        const row = document.createElement('div');
        row.style.cssText = 'margin-bottom: 15px;';

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 5px;';
        const nameSpan = document.createElement('span');
        nameSpan.style.fontWeight = '600';
        nameSpan.textContent = controlNames[key] || key;
        const scoreSpan = document.createElement('span');
        scoreSpan.style.cssText = `color: ${color}; font-weight: bold;`;
        scoreSpan.textContent = Math.round(score) + '%';
        header.appendChild(nameSpan);
        header.appendChild(scoreSpan);
        row.appendChild(header);

        const barOuter = document.createElement('div');
        barOuter.style.cssText = 'width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;';
        const barInner = document.createElement('div');
        barInner.style.cssText = `width: ${score}%; height: 100%; background: ${color};`;
        barOuter.appendChild(barInner);
        row.appendChild(barOuter);

        container.appendChild(row);
    });
    return container;
}

function formatControlName(control) {
    const names = {
        firewalls: 'Firewalls',
        secureConfig: 'Secure Configuration',
        updates: 'Security Update Management',
        accessControl: 'User Access Control',
        malware: 'Malware Protection',
        scope: 'Scope & Context'
    };
    return names[control] || control;
}

// =============================================
// PDF EXPORT
// =============================================
function printToPDF() {
    showCompanyNameModal();
}

function showCompanyNameModal() {
    const modal = document.createElement('div');
    modal.id = 'company-name-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.8); z-index: 999999;
        display: flex; align-items: center; justify-content: center;
    `;

    const box = document.createElement('div');
    box.style.cssText = 'background: white; padding: 40px; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.3);';

    const h2 = document.createElement('h2');
    h2.style.cssText = 'color: #028090; margin: 0 0 10px 0; font-size: 24px;';
    h2.textContent = 'Company Name Required';
    box.appendChild(h2);

    const p = document.createElement('p');
    p.style.cssText = 'color: #666; margin: 0 0 20px 0; line-height: 1.6;';
    p.textContent = 'Please enter your company name. This will appear at the top of your PDF report.';
    box.appendChild(p);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'company-name-input';
    input.placeholder = 'Enter company name...';
    input.style.cssText = 'width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 16px; box-sizing: border-box; margin-bottom: 20px;';
    box.appendChild(input);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding: 12px 24px; background: #fff; color: #666; border: 2px solid #ddd; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: 600;';
    cancelBtn.addEventListener('click', closeCompanyNameModal);
    btnRow.appendChild(cancelBtn);

    const contBtn = document.createElement('button');
    contBtn.textContent = 'Continue';
    contBtn.style.cssText = 'padding: 12px 24px; background: linear-gradient(135deg, #028090 0%, #00A896 100%); color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: 600;';
    contBtn.addEventListener('click', continueWithPDF);
    btnRow.appendChild(contBtn);

    box.appendChild(btnRow);
    modal.appendChild(box);
    document.body.appendChild(modal);

    setTimeout(() => input.focus(), 100);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') continueWithPDF(); });
}

function closeCompanyNameModal() {
    const modal = document.getElementById('company-name-modal');
    if (modal) modal.remove();
}

function continueWithPDF() {
    const input = document.getElementById('company-name-input');
    const companyName = input ? input.value.trim() : '';
    if (!companyName) {
        alert('Please enter a company name to continue.');
        input.focus();
        return;
    }
    closeCompanyNameModal();
    showPDFInstructions(companyName);
}

function showPDFInstructions(companyName) {
    const modal = document.createElement('div');
    modal.id = 'pdf-instructions-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.8); z-index: 999999;
        display: flex; align-items: center; justify-content: center;
    `;

    const box = document.createElement('div');
    box.style.cssText = 'background: white; padding: 40px; border-radius: 12px; max-width: 600px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.3);';

    const icon = document.createElement('div');
    icon.style.cssText = 'font-size: 48px; text-align: center; margin-bottom: 20px;';
    icon.textContent = '\uD83D\uDCC4';
    box.appendChild(icon);

    const h2 = document.createElement('h2');
    h2.style.cssText = 'color: #028090; margin: 0 0 20px 0; font-size: 28px; text-align: center;';
    h2.textContent = 'Save Your Assessment as PDF';
    box.appendChild(h2);

    const instructions = document.createElement('div');
    instructions.style.cssText = 'text-align: left; margin-bottom: 30px; line-height: 1.8; color: #333;';
    instructions.innerHTML = `
        <p style="margin-bottom: 15px;"><strong>Important Instructions:</strong></p>
        <ol style="padding-left: 20px; margin: 0;">
            <li style="margin-bottom: 10px;">In the print dialog, select <strong>"Save as PDF"</strong> or <strong>"Microsoft Print to PDF"</strong> as your printer</li>
            <li style="margin-bottom: 10px;">Under <strong>"More settings"</strong>, uncheck <strong>"Headers and footers"</strong> to remove the URL from the page</li>
            <li style="margin-bottom: 10px;">Click <strong>"Save"</strong> or <strong>"Print"</strong></li>
            <li style="margin-bottom: 10px;">Choose where to save your PDF file</li>
        </ol>
        <p style="margin-top: 20px; padding: 15px; background: #FFF3CD; border-left: 4px solid #FFC107; border-radius: 4px; font-size: 14px;">
            <strong>Note:</strong> If you don't see "Save as PDF" option, look for "Destination" or "Printer" dropdown and select PDF from there.
        </p>
    `;
    box.appendChild(instructions);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display: flex; gap: 10px; justify-content: center;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding: 12px 24px; background: #fff; color: #666; border: 2px solid #ddd; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: 600;';
    cancelBtn.addEventListener('click', () => {
        const m = document.getElementById('pdf-instructions-modal');
        if (m) m.remove();
    });
    btnRow.appendChild(cancelBtn);

    const printBtn = document.createElement('button');
    printBtn.textContent = 'Open Print Dialog';
    printBtn.style.cssText = 'padding: 12px 24px; background: linear-gradient(135deg, #028090 0%, #00A896 100%); color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: 600;';
    printBtn.addEventListener('click', () => proceedToPrint(companyName));
    btnRow.appendChild(printBtn);

    box.appendChild(btnRow);
    modal.appendChild(box);
    document.body.appendChild(modal);
}

function proceedToPrint(companyName) {
    const modal = document.getElementById('pdf-instructions-modal');
    if (modal) modal.remove();
    addCompanyNameToResults(companyName);
    addAppendixToResults();
    setTimeout(() => {
        window.print();
        setTimeout(() => {
            removeCompanyNameFromResults();
            removeAppendixFromResults();
        }, 2000);
    }, 100);
}

function addCompanyNameToResults(companyName) {
    const resultsDiv = document.getElementById('results');
    let companyHeader = document.getElementById('company-name-header');
    if (!companyHeader) {
        companyHeader = document.createElement('div');
        companyHeader.id = 'company-name-header';
        companyHeader.style.cssText = `
            background: linear-gradient(135deg, #028090 0%, #00A896 100%);
            color: white; padding: 20px 30px;
            margin: -30px -30px 30px -30px;
            border-radius: 8px 8px 0 0;
        `;

        const label = document.createElement('div');
        label.style.cssText = 'font-size: 14px; opacity: 0.9; margin-bottom: 5px;';
        label.textContent = 'Assessment Report for:';
        companyHeader.appendChild(label);

        const name = document.createElement('div');
        name.style.cssText = 'font-size: 24px; font-weight: bold;';
        name.textContent = companyName; // Safe: textContent, no HTML injection
        companyHeader.appendChild(name);

        const date = document.createElement('div');
        date.style.cssText = 'font-size: 14px; opacity: 0.9; margin-top: 5px;';
        date.textContent = 'Generated: ' + new Date().toLocaleString();
        companyHeader.appendChild(date);

        const resultHeader = resultsDiv.querySelector('.result-header');
        resultsDiv.insertBefore(companyHeader, resultHeader);
    } else {
        companyHeader.children[1].textContent = companyName;
        companyHeader.children[2].textContent = 'Generated: ' + new Date().toLocaleString();
    }
}

function removeCompanyNameFromResults() {
    const companyHeader = document.getElementById('company-name-header');
    if (companyHeader) companyHeader.remove();
}

// =============================================
// APPENDIX — Text input details for PDF report
// =============================================
function addAppendixToResults() {
    removeAppendixFromResults(); // avoid duplicates

    const appendixFields = [
        { id: 'q1_firewall_details', label: 'Firewall Solution(s)' },
        { id: 'q5_malware_details', label: 'Anti-Malware / Antivirus Software' },
        { id: 'q3_5', label: 'Outdated Software Identified' },
        { id: 'q6_4', label: 'Number of Devices in Scope' },
        { id: 'q6_5', label: 'Cloud Services in Use' },
        { id: 'q6_backup_details', label: 'Backup Solution & Procedures' },
        { id: 'q6_incident_details', label: 'Incident Response Procedures' }
    ];

    // Collect fields that have values
    const filledFields = appendixFields.filter(f => {
        const el = document.getElementById(f.id);
        return el && el.value.trim();
    });

    if (filledFields.length === 0) return;

    const appendix = document.createElement('div');
    appendix.id = 'report-appendix';
    appendix.style.cssText = 'margin-top: 40px; padding-top: 30px; border-top: 3px solid #028090;';

    const heading = document.createElement('h3');
    heading.style.cssText = 'color: #028090; margin-bottom: 20px; font-size: 22px;';
    heading.textContent = 'Appendix: Infrastructure & Configuration Details';
    appendix.appendChild(heading);

    filledFields.forEach(field => {
        const el = document.getElementById(field.id);
        const value = el.value.trim();

        const item = document.createElement('div');
        item.className = 'appendix-item';
        item.style.cssText = 'margin-bottom: 18px; padding: 15px; background: #f8f9fa; border-left: 4px solid #00A896; border-radius: 4px;';

        const label = document.createElement('div');
        label.style.cssText = 'font-weight: 600; color: #028090; margin-bottom: 6px; font-size: 15px;';
        label.textContent = field.label;
        item.appendChild(label);

        const content = document.createElement('div');
        content.style.cssText = 'color: #333; line-height: 1.6; font-size: 14px; white-space: pre-wrap;';
        content.textContent = value;
        item.appendChild(content);

        appendix.appendChild(item);
    });

    const resultsContent = document.getElementById('results-content');
    resultsContent.appendChild(appendix);
}

function removeAppendixFromResults() {
    const appendix = document.getElementById('report-appendix');
    if (appendix) appendix.remove();
}
