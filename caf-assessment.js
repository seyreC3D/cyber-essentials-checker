'use strict';

// ─────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────
const STORAGE_KEY = 'caf_assessment_v1';
const SECTION_IDS = ['A1','A2','A3','A4','B1','B2','B3','B4','B5','B6','C1','C2','D1','D2'];
const SECTION_COUNTS = { A1:6, A2:4, A3:3, A4:4, B1:4, B2:8, B3:10, B4:8, B5:6, B6:4, C1:12, C2:4, D1:6, D2:4 };
const TOTAL_QUESTIONS = Object.values(SECTION_COUNTS).reduce((a,b) => a+b, 0);
const CIRCUMFERENCE = 2 * Math.PI * 34; // ring radius = 34
const API_PROXY_URL = 'https://cyber-essentials-checker.vercel.app/api/analyze';

// ─────────────────────────────────────────
//  Init
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSaved();
  updateProgress();
  attachAutoSave();
  // Collapse all sections except A1 on load
  SECTION_IDS.forEach((id, i) => {
    if (i > 0) collapseSection(id);
  });
  // Show welcome if first visit
  if (!localStorage.getItem('caf_welcomed')) {
    document.getElementById('welcome-overlay').style.display = 'flex';
  } else {
    document.getElementById('welcome-overlay').style.display = 'none';
  }
  // Wire progress row clicks
  document.querySelectorAll('.progress-row').forEach(row => {
    row.addEventListener('click', () => {
      const target = row.dataset.target;
      expandSection(target);
      document.querySelector(`#content-${target}`)
        .closest('.assessment-section')
        .scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});

// ─────────────────────────────────────────
//  Welcome modal
// ─────────────────────────────────────────
function showWelcomeModal() {
  document.getElementById('welcome-overlay').style.display = 'flex';
}
function dismissWelcome() {
  document.getElementById('welcome-overlay').style.display = 'none';
  localStorage.setItem('caf_welcomed', '1');
}

// ─────────────────────────────────────────
//  Section toggling
// ─────────────────────────────────────────
function toggleSection(id) {
  const content = document.getElementById('content-' + id);
  const icon    = document.getElementById('toggle-' + id);
  if (content.classList.contains('hidden')) {
    expandSection(id);
  } else {
    collapseSection(id);
  }
}
function expandSection(id) {
  const content = document.getElementById('content-' + id);
  const icon    = document.getElementById('toggle-' + id);
  if (content && icon) {
    content.classList.remove('hidden');
    icon.classList.remove('collapsed');
  }
}
function collapseSection(id) {
  const content = document.getElementById('content-' + id);
  const icon    = document.getElementById('toggle-' + id);
  if (content && icon) {
    content.classList.add('hidden');
    icon.classList.add('collapsed');
  }
}

// ─────────────────────────────────────────
//  Auto-save & manual save
// ─────────────────────────────────────────
let saveTimer = null;
function attachAutoSave() {
  document.querySelectorAll('input[type="radio"]').forEach(el => {
    el.addEventListener('change', scheduleSave);
  });
}
function scheduleSave() {
  clearTimeout(saveTimer);
  updateSaveUI('saving');
  saveTimer = setTimeout(() => {
    saveState();
    updateSaveUI('saved');
  }, 800);
}
function saveState() {
  const state = {};
  document.querySelectorAll('input[type="radio"]:checked').forEach(el => {
    state[el.name] = el.value;
  });
  // Include sector selection
  const sectorEl = document.getElementById('sector-select');
  if (sectorEl) state._sector = sectorEl.value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem(STORAGE_KEY + '_ts', new Date().toISOString());
  updateProgress();
}
function loadSaved() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    Object.entries(state).forEach(([name, value]) => {
      if (name === '_sector') {
        const sectorEl = document.getElementById('sector-select');
        if (sectorEl) sectorEl.value = value;
        return;
      }
      const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
      if (el) el.checked = true;
    });
  } catch (e) { /* ignore corrupt state */ }
  // Show last saved timestamp
  const ts = localStorage.getItem(STORAGE_KEY + '_ts');
  if (ts) updateSaveUI('restored', ts);
}

function getSelectedSector() {
  const el = document.getElementById('sector-select');
  return el ? el.value : '';
}

function getSectorLabel() {
  const el = document.getElementById('sector-select');
  if (!el || !el.value) return '';
  return el.options[el.selectedIndex].textContent;
}

function manualSave() {
  const btn = document.getElementById('save-progress-btn');
  btn.classList.add('saving');
  btn.innerHTML = '<span class="save-icon">&#9203;</span> Saving\u2026';
  saveState();
  setTimeout(() => {
    btn.classList.remove('saving');
    btn.classList.add('saved');
    btn.innerHTML = '<span class="save-icon">&#10003;</span> Saved!';
    updateSaveUI('saved');
    setTimeout(() => {
      btn.classList.remove('saved');
      btn.innerHTML = '<span class="save-icon" id="save-icon">&#128190;</span> Save Progress';
    }, 2000);
  }, 400);
}

function formatSaveTime(isoStr) {
  try {
    const d = new Date(isoStr || Date.now());
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { return ''; }
}

function updateSaveUI(state, timestamp) {
  const statusText = document.getElementById('save-status-text');
  const statusIcon = document.getElementById('save-status-icon');
  const tsEl       = document.getElementById('save-timestamp');
  const notice     = document.getElementById('save-notice');
  const noticeText = document.getElementById('save-notice-text');

  const now = formatSaveTime(timestamp);

  if (state === 'saving') {
    if (statusText) statusText.textContent = 'Saving\u2026';
    if (statusIcon) { statusIcon.textContent = '\u25cf'; statusIcon.classList.add('unsaved'); }
    if (notice) notice.classList.remove('just-saved');
  } else if (state === 'saved') {
    const time = formatSaveTime();
    if (statusText) statusText.textContent = 'All changes saved';
    if (statusIcon) { statusIcon.textContent = '\u25cf'; statusIcon.classList.remove('unsaved'); }
    if (tsEl) tsEl.textContent = 'at ' + time;
    if (noticeText) noticeText.textContent = 'Progress saved to your browser at ' + time;
    if (notice) { notice.classList.add('just-saved'); setTimeout(() => notice.classList.remove('just-saved'), 2500); }
  } else if (state === 'restored') {
    if (statusText) statusText.textContent = 'Previous session restored';
    if (statusIcon) { statusIcon.textContent = '\u25cf'; statusIcon.classList.remove('unsaved'); }
    if (tsEl && now) tsEl.textContent = 'last saved ' + now;
    if (noticeText && now) noticeText.textContent = 'Previous progress restored \u2014 last saved at ' + now;
  } else if (state === 'cleared') {
    if (statusText) statusText.textContent = 'Cleared';
    if (statusIcon) { statusIcon.textContent = '\u25cb'; statusIcon.classList.add('unsaved'); }
    if (tsEl) tsEl.textContent = '';
    if (noticeText) noticeText.textContent = 'Auto-saved to your browser';
  }
}

function clearAll() {
  if (!confirm('Clear all answers? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY + '_ts');
  document.querySelectorAll('input[type="radio"]:checked').forEach(el => { el.checked = false; });
  document.querySelectorAll('.consultant-response').forEach(el => {
    el.classList.remove('visible');
    el.textContent = '';
  });
  updateProgress();
  updateSaveUI('cleared');
}

// ─────────────────────────────────────────
//  Progress tracking
// ─────────────────────────────────────────
function updateProgress() {
  let totalAnswered = 0;
  SECTION_IDS.forEach(id => {
    const expected = SECTION_COUNTS[id];
    // Count answered questions in this section
    const content  = document.getElementById('content-' + id);
    if (!content) return;
    const questions = content.querySelectorAll('.question');
    let answered = 0;
    questions.forEach(qDiv => {
      const radios = qDiv.querySelectorAll('input[type="radio"]');
      const checked = Array.from(radios).some(r => r.checked);
      if (checked) answered++;
    });
    totalAnswered += answered;
    // Update count label
    const countEl = document.getElementById('progress-count-' + id);
    if (countEl) countEl.textContent = answered + '/' + expected;
    // Update badge
    const badge = document.getElementById('progress-badge-' + id);
    if (badge) {
      badge.classList.remove('complete', 'partial', 'started');
      if (answered === expected) badge.classList.add('complete');
      else if (answered > 0)     badge.classList.add(answered >= expected / 2 ? 'partial' : 'started');
    }
  });
  // Ring
  const pct = totalAnswered / TOTAL_QUESTIONS;
  const ring = document.getElementById('progress-ring-fill');
  if (ring) ring.style.strokeDashoffset = (1 - pct) * CIRCUMFERENCE;
  const label = document.getElementById('progress-ring-label');
  if (label) label.textContent = Math.round(pct * 100) + '%';
  const sub = document.getElementById('progress-ring-sub');
  if (sub) sub.textContent = totalAnswered + ' of ' + TOTAL_QUESTIONS + ' answered';
}

// ─────────────────────────────────────────
//  Ask Oracle
// ─────────────────────────────────────────
async function askOracle(btn) {
  const questionId = btn.dataset.questionId;
  const responseDiv = document.getElementById('consultant-' + questionId);
  if (!responseDiv) return;

  // Find the question text and help text
  const qDiv     = btn.closest('.question');
  const qText    = qDiv.querySelector('.question-text').textContent.trim();
  const helpText = qDiv.querySelector('.question-help').textContent.trim();
  const outcome  = qDiv.dataset.outcome || '';
  const principle = qDiv.dataset.principle || '';

  // Toggle off if already showing
  if (responseDiv.classList.contains('visible')) {
    responseDiv.classList.remove('visible');
    return;
  }

  btn.disabled = true;
  btn.classList.add('loading');
  btn.textContent = 'Asking Oracle\u2026';
  responseDiv.classList.add('visible');
  responseDiv.textContent = 'Fetching guidance\u2026';

  const prompt = `You are a NCSC Cyber Assessment Framework (CAF) v4.0 expert helping a UK organisation complete their CAF self-assessment.

CAF Principle: ${principle}, Outcome: ${outcome}
Assessment question: "${qText}"
Context: ${helpText}

Provide concise, practical guidance (3-5 bullet points) to help this organisation understand what "Achieved" looks like for this outcome, common pitfalls, and what evidence an assessor would typically expect. Keep the tone constructive and actionable. Format as plain bullet points (start each line with •).`;

  try {
    const resp = await fetch(API_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 400
      })
    });
    if (!resp.ok) throw new Error('API ' + resp.status);
    const data = await resp.json();
    const text = data.text || data.content?.[0]?.text || 'No response received.';
    responseDiv.textContent = '';
    // Render bullet points as separate lines
    text.split('\n').forEach(line => {
      if (!line.trim()) return;
      const p = document.createElement('p');
      p.style.margin = '0 0 4px';
      p.textContent = line.trim();
      responseDiv.appendChild(p);
    });
  } catch (err) {
    responseDiv.textContent = '\u26a0\ufe0f  Could not reach Oracle. Check your network or API key. (' + err.message + ')';
  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.textContent = responseDiv.children.length || responseDiv.textContent ? 'Hide Oracle response' : 'Need help? Ask Oracle';
  }
}

// ─────────────────────────────────────────
//  Collect responses
// ─────────────────────────────────────────
function collectResponses() {
  const responses = {};
  SECTION_IDS.forEach(id => {
    responses[id] = {};
    const content = document.getElementById('content-' + id);
    if (!content) return;
    content.querySelectorAll('.question').forEach(qDiv => {
      const radios  = qDiv.querySelectorAll('input[type="radio"]');
      const checked = Array.from(radios).find(r => r.checked);
      const outcome = qDiv.dataset.outcome;
      if (outcome && checked) {
        const name = checked.name;
        responses[id][name] = checked.value;
      }
    });
  });
  return responses;
}

function countAnswered() {
  return document.querySelectorAll('input[type="radio"]:checked').length;
}

// ─────────────────────────────────────────
//  Run Analysis
// ─────────────────────────────────────────
async function runAnalysis() {
  const answered = countAnswered();
  if (answered < 10) {
    alert('Please answer at least 10 questions before running analysis.');
    return;
  }

  const btn = document.getElementById('analyze-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Analysing\u2026'; }

  const responses = collectResponses();
  const scoreMap = buildScores(responses);

  const prompt = buildAnalysisPrompt(responses, scoreMap);

  try {
    const resp = await fetch(API_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 3000
      })
    });
    if (!resp.ok) throw new Error('API ' + resp.status);
    const data = await resp.json();
    const text = data.text || data.content?.[0]?.text || '';
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) { parsed = null; }

    displayResults(parsed || buildFallbackResult(scoreMap), scoreMap);
  } catch (err) {
    // Fallback local analysis
    displayResults(buildFallbackResult(scoreMap), scoreMap);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Analyse with Oracle \u2192'; }
  }
}

// ─────────────────────────────────────────
//  Score building
// ─────────────────────────────────────────
const SCORE_MAP = { achieved: 100, partial: 50, 'not-achieved': 0, na: null };

function buildScores(responses) {
  const scores = {};
  SECTION_IDS.forEach(id => {
    const sectionResp = responses[id] || {};
    const vals = Object.values(sectionResp)
      .map(v => SCORE_MAP[v])
      .filter(v => v !== null && v !== undefined);
    scores[id] = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0) / vals.length) : null;
  });
  return scores;
}

function overallScore(scoreMap) {
  const vals = Object.values(scoreMap).filter(v => v !== null);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a,b)=>a+b,0) / vals.length);
}

// ─────────────────────────────────────────
//  Analysis prompt
// ─────────────────────────────────────────
function buildAnalysisPrompt(responses, scoreMap) {
  const overall = overallScore(scoreMap);
  const sectorLabel = getSectorLabel();
  const sectionSummary = SECTION_IDS.map(id => {
    const s = scoreMap[id];
    return `${id}: ${s !== null ? s + '%' : 'not attempted'}`;
  }).join(', ');

  const lowSections = SECTION_IDS
    .filter(id => scoreMap[id] !== null && scoreMap[id] < 50)
    .map(id => id);

  const sectorLine = sectorLabel
    ? `Organisation sector: ${sectorLabel}\n`
    : '';

  return `You are a NCSC Cyber Assessment Framework (CAF) v4.0 assessor analysing a UK organisation's self-assessment results.

${sectorLine}CAF PRINCIPLE REFERENCE — use these EXACT mappings when tagging recommendations:
Objective A — Managing Security Risk:
  A1 Governance: board direction, roles & responsibilities, security decision-making
  A2 Risk Management: risk management processes, risk assessment, risk appetite
  A3 Asset Management: identifying and managing hardware, software, data assets
  A4 Supply Chain: supply chain risk management, third-party assurance

Objective B — Protecting Against Cyber Attack:
  B1 Service Protection Policies & Processes: security policies, acceptable use, operational procedures
  B2 Identity & Access Control: authentication, access management, privileged accounts, MFA
  B3 Data Security: data-at-rest/in-transit protection, encryption, media handling
  B4 System Security: secure configuration, patch management, vulnerability management
  B5 Resilient Networks & Systems: resilience, redundancy, backups, disaster recovery
  B6 Staff Awareness & Training: security awareness, phishing training, role-based training

Objective C — Detecting Cyber Security Events:
  C1 Security Monitoring: SIEM, logging, network monitoring, 24/7 SOC, alert triage, security event detection
  C2 Proactive Security Event Discovery: threat hunting, penetration testing, vulnerability scanning, red-teaming

Objective D — Minimising the Impact of Cyber Security Incidents:
  D1 Response & Recovery Planning: incident response plans, crisis management, business continuity, recovery procedures
  D2 Lessons Learned: post-incident reviews, root cause analysis, improvement actions

CRITICAL: Match each recommendation to the CORRECT principle above. For example:
- SIEM, logging, monitoring, event detection → C1 (NOT D1)
- Penetration testing, threat hunting, vulnerability scanning → C2 (NOT D1)
- Incident response plans, recovery procedures → D1
- Post-incident reviews → D2

Overall score: ${overall}%
Section scores: ${sectionSummary}
Sections scoring below 50%: ${lowSections.join(', ') || 'none'}
Total questions answered: ${countAnswered()} of ${TOTAL_QUESTIONS}

Provide a JSON response in this exact structure:
{
  "overallRating": "one of: Achieved / Partially Achieved / Not Achieved",
  "summary": "2-3 sentence executive summary",
  "criticalGaps": ["up to 5 most critical gaps as short strings"],
  "strengths": ["up to 3 strengths"],
  "priorityActions": [
    {"action": "short description", "principle": "e.g. B4", "effort": "Low/Medium/High", "impact": "Low/Medium/High"}
  ],
  "objectiveRatings": {
    "A": "Achieved/Partially Achieved/Not Achieved",
    "B": "Achieved/Partially Achieved/Not Achieved",
    "C": "Achieved/Partially Achieved/Not Achieved",
    "D": "Achieved/Partially Achieved/Not Achieved"
  },
  "regulatoryNote": "1 sentence on NIS/GDPR/sector regulatory implications if applicable"
}`;
}

// ─────────────────────────────────────────
//  Sector-specific regulatory note
// ─────────────────────────────────────────
function buildRegulatoryNote(sector) {
  const notes = {
    'energy':           'As an energy sector operator you are likely subject to the NIS Regulations 2018. Regulators (Ofgem/BEIS) expect CAF compliance for network and information systems supporting electricity, gas, or oil distribution.',
    'transport':        'Transport operators (aviation, rail, maritime, road) fall under the NIS Regulations 2018. The relevant Competent Authority (CAA, ORR, MCA, DfT) may request CAF evidence and can issue improvement notices.',
    'health':           'NHS bodies and health and social care providers are regulated under the NIS Regulations 2018, with DHSC and NHS England as Competent Authorities. DSPT compliance is also required and maps closely to CAF outcomes.',
    'water':            'Drinking water suppliers are Operators of Essential Services under the NIS Regulations 2018. The Drinking Water Inspectorate (DWI) acts as Competent Authority and may conduct CAF audits.',
    'digital-infra':    'DNS providers, IXPs, and TLD registries are Operators of Essential Services under NIS Regulations 2018. Ofcom acts as Competent Authority and can issue binding instructions following a CAF assessment.',
    'digital-services': 'Online marketplaces, online search engines, and cloud computing services are Relevant Digital Service Providers under NIS Regulations 2018. DCMS oversees compliance; baseline security requirements apply.',
    'finance':          'Financial institutions are subject to FCA/PRA operational resilience requirements and DORA (effective January 2025 for UK-nexus EU operations). CAF outcomes align closely with DORA ICT risk management pillars.',
    'government':       'Central government departments and arm's-length bodies follow the Government Cyber Security Strategy and must meet the Cyber Assessment Framework outcomes set by NCSC and DSIT. GovAssure uses the CAF as its primary assurance mechanism.',
    'defence':          'Defence suppliers handling MOD data must comply with the Cyber Security Model (CSM) and Def Stan 05-138. CAF Objective B controls are particularly relevant to supply chain security requirements.',
    'education':        'Higher education institutions handling sensitive research data should be aware of DSIT funding conditions and JISC sector guidance. CAF adoption is increasingly expected for research councils and technology transfer.',
    'telecoms':         'Telecoms providers are subject to the Network and Information Systems (NIS) Regulations 2018 and the Telecommunications Security Act 2021. Ofcom oversees CAF-aligned security duties under the TSA framework.',
  };
  const note = notes[sector];
  return note || 'Review NIS Regulations 2018 and NCSC CAF guidance to identify the compliance obligations relevant to your sector and Competent Authority.';
}

// ─────────────────────────────────────────
//  Fallback local result
// ─────────────────────────────────────────
function buildFallbackResult(scoreMap) {
  const overall = overallScore(scoreMap);
  const rating = overall >= 70 ? 'Achieved' : overall >= 40 ? 'Partially Achieved' : 'Not Achieved';
  const lowSections = SECTION_IDS.filter(id => scoreMap[id] !== null && scoreMap[id] < 50);
  const highSections = SECTION_IDS.filter(id => scoreMap[id] !== null && scoreMap[id] >= 75);

  const objScores = {};
  [['A',['A1','A2','A3','A4']], ['B',['B1','B2','B3','B4','B5','B6']], ['C',['C1','C2']], ['D',['D1','D2']]]
    .forEach(([obj, ids]) => {
      const vals = ids.map(id => scoreMap[id]).filter(v => v !== null);
      const avg = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : null;
      objScores[obj] = avg !== null ? (avg >= 70 ? 'Achieved' : avg >= 40 ? 'Partially Achieved' : 'Not Achieved') : 'Not Attempted';
    });

  return {
    overallRating: rating,
    summary: `Local analysis (API unavailable). Overall score: ${overall}%. ${lowSections.length} section(s) below 50%. This is an indicative score only.`,
    criticalGaps: lowSections.slice(0,5).map(id => `${id} requires attention (score: ${scoreMap[id]}%)`),
    strengths: highSections.slice(0,3).map(id => `${id} performing well (${scoreMap[id]}%)`),
    priorityActions: lowSections.slice(0,3).map(id => ({
      action: `Improve ${id} controls`, principle: id, effort: 'Medium', impact: 'High'
    })),
    objectiveRatings: objScores,
    regulatoryNote: buildRegulatoryNote(getSelectedSector())
  };
}

// ─────────────────────────────────────────
//  Display results
// ─────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function ratingColor(r) {
  if (!r) return '#7f8c8d';
  const l = r.toLowerCase();
  if (l.includes('not achieved')) return '#c0392b';
  if (l.includes('partial'))      return '#f39c12';
  return '#27ae60';
}

// ─────────────────────────────────────────
//  Principle labels (used by radar chart)
// ─────────────────────────────────────────
const PRINCIPLE_LABELS = {
  A1:'Governance', A2:'Risk Mgmt', A3:'Assets', A4:'Supply Chain',
  B1:'Policies', B2:'Identity', B3:'Data', B4:'Systems',
  B5:'Resilience', B6:'Training', C1:'Monitoring', C2:'Discovery',
  D1:'Response', D2:'Lessons'
};

// ─────────────────────────────────────────
//  14-axis radar / spider chart (pure SVG)
// ─────────────────────────────────────────
function buildCAFRadarChart(scoreMap) {
  const ids = SECTION_IDS;
  const n   = ids.length; // 14
  // Wider viewBox (520) with centred chart to prevent label clipping
  const cx  = 260, cy = 210, maxR = 150;
  const VB_W = 520;
  const BENCHMARK = 0.70; // 70% "Achieved" threshold

  function polar(index, ratio) {
    const angle = (-Math.PI / 2) + (index * 2 * Math.PI / n);
    return {
      x: cx + maxR * ratio * Math.cos(angle),
      y: cy + maxR * ratio * Math.sin(angle)
    };
  }

  // Build grid rings (25%, 50%, 75%, 100%)
  let gridSVG = '';
  [0.25, 0.50, 0.75, 1.0].forEach(ring => {
    const pts = ids.map((_, i) => {
      const p = polar(i, ring);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');
    gridSVG += `<polygon points="${pts}" fill="none" stroke="#dde3ea" stroke-width="0.8"/>`;
  });

  // Axis lines + labels
  let axesSVG = '';
  ids.forEach((id, i) => {
    const p = polar(i, 1.0);
    axesSVG += `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#e8eaed" stroke-width="0.5"/>`;
    // Label position — pushed further out so text doesn't overlap polygon
    const lp = polar(i, 1.24);
    const score = scoreMap[id];
    const shortName = PRINCIPLE_LABELS[id] || id;
    const scoreText = score !== null ? ` ${score}%` : '';
    // Determine text-anchor based on horizontal position
    let anchor = 'middle';
    if (lp.x < cx - 12) anchor = 'end';
    else if (lp.x > cx + 12) anchor = 'start';
    axesSVG += `<text x="${lp.x.toFixed(1)}" y="${lp.y.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="central" font-size="9" font-weight="600" fill="#1a3a5c">${escapeHtml(id)}</text>`;
    axesSVG += `<text x="${lp.x.toFixed(1)}" y="${(lp.y + 12).toFixed(1)}" text-anchor="${anchor}" dominant-baseline="central" font-size="7.5" fill="#5a6a7a">${escapeHtml(shortName)}${escapeHtml(scoreText)}</text>`;
  });

  // Benchmark polygon (70% threshold)
  const benchPts = ids.map((_, i) => {
    const p = polar(i, BENCHMARK);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');
  const benchSVG = `<polygon points="${benchPts}" fill="none" stroke="#c0392b" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.6"/>`;

  // Data polygon
  const dataPts = ids.map((id, i) => {
    const ratio = scoreMap[id] !== null ? scoreMap[id] / 100 : 0;
    const p = polar(i, ratio);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');
  const dataSVG = `<polygon points="${dataPts}" fill="rgba(0,168,120,0.18)" stroke="#00a878" stroke-width="2.2"/>`;

  // Data dots
  let dotsSVG = '';
  ids.forEach((id, i) => {
    const score = scoreMap[id];
    const ratio = score !== null ? score / 100 : 0;
    const p = polar(i, ratio);
    const color = score === null ? '#7f8c8d' : score >= 70 ? '#27ae60' : score >= 40 ? '#f39c12' : '#c0392b';
    dotsSVG += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="${color}" stroke="#fff" stroke-width="1.2"/>`;
  });

  // Legend (centred below chart)
  const legendY = cy + maxR + 40;
  const legendSVG = `
    <line x1="${cx - 90}" y1="${legendY}" x2="${cx - 70}" y2="${legendY}" stroke="#00a878" stroke-width="2.2"/>
    <text x="${cx - 66}" y="${legendY}" dominant-baseline="central" font-size="8" fill="#5a6a7a">Your score</text>
    <line x1="${cx + 10}" y1="${legendY}" x2="${cx + 30}" y2="${legendY}" stroke="#c0392b" stroke-width="1.2" stroke-dasharray="5,3" opacity="0.6"/>
    <text x="${cx + 34}" y="${legendY}" dominant-baseline="central" font-size="8" fill="#5a6a7a">70% Achieved threshold</text>
  `;

  const wrapper = document.createElement('div');
  wrapper.className = 'caf-radar-wrapper';
  wrapper.innerHTML = `<svg viewBox="0 0 ${VB_W} ${legendY + 20}" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:480px;display:block;margin:0 auto;">
    ${gridSVG}${axesSVG}${benchSVG}${dataSVG}${dotsSVG}${legendSVG}
  </svg>`;
  return wrapper;
}

// ─────────────────────────────────────────
//  Display results (with radar chart)
// ─────────────────────────────────────────
function displayResults(result, scoreMap) {
  const panel   = document.getElementById('results-panel');
  const content = document.getElementById('results-content');
  content.innerHTML = '';

  // Store result for PDF export
  panel._lastResult = result;
  panel._lastScoreMap = scoreMap;

  // ── Overall summary card ──
  const overall = overallScore(scoreMap);
  const summaryCard = document.createElement('div');
  summaryCard.className = 'results-summary';

  const scoreRow = document.createElement('div');
  scoreRow.className = 'results-score-row';

  const scoreEl = document.createElement('div');
  scoreEl.innerHTML = `<div class="overall-score">${overall}%</div><div class="overall-label">Overall CAF Readiness</div>`;

  const ratingEl = document.createElement('div');
  ratingEl.style.cssText = `font-size:1.1rem;font-weight:700;color:${ratingColor(result.overallRating)}`;
  ratingEl.textContent = result.overallRating || 'Not Assessed';
  scoreRow.appendChild(scoreEl);
  scoreRow.appendChild(ratingEl);
  summaryCard.appendChild(scoreRow);

  if (result.summary) {
    const p = document.createElement('p');
    p.style.cssText = 'font-size:.9rem;color:#5a6a7a;margin-bottom:16px;';
    p.textContent = result.summary;
    summaryCard.appendChild(p);
  }

  // Objective ratings
  if (result.objectiveRatings) {
    const objRow = document.createElement('div');
    objRow.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;';
    Object.entries(result.objectiveRatings).forEach(([obj, rating]) => {
      const chip = document.createElement('div');
      chip.style.cssText = `padding:6px 14px;border-radius:20px;font-size:.82rem;font-weight:600;background:${ratingColor(rating)}22;color:${ratingColor(rating)};border:1px solid ${ratingColor(rating)}55;`;
      chip.textContent = `Obj ${obj}: ${rating}`;
      objRow.appendChild(chip);
    });
    summaryCard.appendChild(objRow);
  }

  // ── Radar chart ──
  summaryCard.appendChild(buildCAFRadarChart(scoreMap));

  // Section score grid
  const grid = document.createElement('div');
  grid.className = 'results-grid';
  SECTION_IDS.forEach(id => {
    const s = scoreMap[id];
    const card = document.createElement('div');
    card.className = 'principle-card';
    const title = document.createElement('div');
    title.className = 'principle-card-title';
    title.textContent = id + ' ' + (PRINCIPLE_LABELS[id] || '');
    const bar = document.createElement('div');
    bar.className = 'principle-bar';
    const fill = document.createElement('div');
    fill.className = 'principle-bar-fill';
    fill.style.width = (s !== null ? s : 0) + '%';
    fill.style.background = s === null ? '#dde3ea' : s >= 70 ? '#27ae60' : s >= 40 ? '#f39c12' : '#c0392b';
    bar.appendChild(fill);
    const label = document.createElement('div');
    label.className = 'principle-score-label';
    label.textContent = s !== null ? s + '%' : 'n/a';
    card.appendChild(title);
    card.appendChild(bar);
    card.appendChild(label);
    grid.appendChild(card);
  });
  summaryCard.appendChild(grid);
  content.appendChild(summaryCard);

  // ── Gaps & Strengths ──
  function makeListCard(title, items, badgeClass) {
    if (!items || !items.length) return;
    const card = document.createElement('div');
    card.className = 'results-issues';
    const h3 = document.createElement('h3');
    h3.textContent = title;
    card.appendChild(h3);
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'issue-item';
      const badge = document.createElement('span');
      badge.className = 'issue-badge ' + badgeClass;
      badge.textContent = badgeClass.includes('critical') ? 'Gap' : badgeClass.includes('warning') ? 'Priority' : '\u2713';
      const text = document.createElement('span');
      text.textContent = typeof item === 'string' ? item : item.action + (item.principle ? ` [${item.principle}]` : '');
      row.appendChild(badge);
      row.appendChild(text);
      card.appendChild(row);
    });
    content.appendChild(card);
  }

  makeListCard('Critical Gaps', result.criticalGaps, 'badge-critical');
  makeListCard('Priority Actions', result.priorityActions, 'badge-warning');
  makeListCard('Strengths', result.strengths, 'badge-good');

  // ── Regulatory note ──
  if (result.regulatoryNote) {
    const note = document.createElement('div');
    note.className = 'caf-regulatory-note';
    note.style.cssText = 'background:#fff;border-radius:10px;padding:16px 20px;font-size:.87rem;color:#5a6a7a;border-left:4px solid #2a5298;margin-top:8px;';
    const strong = document.createElement('strong');
    strong.textContent = 'Regulatory note: ';
    note.appendChild(strong);
    note.appendChild(document.createTextNode(result.regulatoryNote));
    content.appendChild(note);
  }

  panel.style.display = 'block';
  panel.scrollTop = 0;
}

function closeResults() {
  document.getElementById('results-panel').style.display = 'none';
}

// ─────────────────────────────────────────
//  PDF export with executive summary
// ─────────────────────────────────────────
function exportPDF() {
  showCompanyNameModal();
}

function showCompanyNameModal() {
  // Remove any existing modal
  const existing = document.getElementById('caf-company-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'caf-company-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';

  const modal = document.createElement('div');
  modal.style.cssText = 'background:#fff;border-radius:10px;padding:32px 36px;max-width:440px;width:100%;box-shadow:0 8px 40px rgba(0,0,0,.22);';

  const h2 = document.createElement('h2');
  h2.style.cssText = 'font-size:1.2rem;color:#1a3a5c;margin-bottom:12px;';
  h2.textContent = 'Export PDF Report';

  const p = document.createElement('p');
  p.style.cssText = 'font-size:.88rem;color:#5a6a7a;margin-bottom:16px;';
  p.textContent = 'Enter your organisation name to personalise the report.';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Organisation name';
  input.id = 'caf-company-input';
  input.style.cssText = 'width:100%;padding:10px 14px;border:1.5px solid #dde3ea;border-radius:8px;font-size:.95rem;margin-bottom:16px;outline:none;';
  input.addEventListener('focus', () => { input.style.borderColor = '#00a878'; });
  input.addEventListener('blur', () => { input.style.borderColor = '#dde3ea'; });

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = 'background:none;border:1px solid #dde3ea;color:#5a6a7a;padding:9px 18px;border-radius:8px;font-size:.87rem;cursor:pointer;';
  cancelBtn.onclick = () => overlay.remove();

  const exportBtn = document.createElement('button');
  exportBtn.textContent = 'Generate PDF';
  exportBtn.style.cssText = 'background:#00a878;color:#fff;border:none;padding:9px 22px;border-radius:8px;font-size:.87rem;font-weight:600;cursor:pointer;';
  exportBtn.onclick = () => {
    const name = input.value.trim();
    if (!name) { input.style.borderColor = '#c0392b'; input.focus(); return; }
    overlay.remove();
    prepareAndPrint(name);
  };

  // Enter key submits
  input.addEventListener('keydown', e => { if (e.key === 'Enter') exportBtn.click(); });

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(exportBtn);
  modal.appendChild(h2);
  modal.appendChild(p);
  modal.appendChild(input);
  modal.appendChild(btnRow);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(() => input.focus(), 50);
}

function prepareAndPrint(companyName) {
  const content = document.getElementById('results-content');
  const panel   = document.getElementById('results-panel');
  const result  = panel._lastResult;
  const scoreMap = panel._lastScoreMap;

  // Remove any previous exec summary / footer
  const oldExec = document.getElementById('caf-exec-summary');
  if (oldExec) oldExec.remove();
  const oldFooter = document.getElementById('caf-print-footer');
  if (oldFooter) oldFooter.remove();

  // ── Build executive summary (inserted before results-content) ──
  const exec = document.createElement('div');
  exec.id = 'caf-exec-summary';
  exec.className = 'caf-exec-summary';

  // Header bar
  const hdr = document.createElement('div');
  hdr.className = 'caf-exec-header';
  const h1 = document.createElement('h1');
  h1.textContent = 'CAF Assessment Report';
  const sub = document.createElement('p');
  sub.className = 'caf-exec-subtitle';
  sub.textContent = companyName;
  const dateLine = document.createElement('p');
  dateLine.className = 'caf-exec-date';
  dateLine.textContent = 'Generated: ' + new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  hdr.appendChild(h1);
  hdr.appendChild(sub);
  hdr.appendChild(dateLine);
  exec.appendChild(hdr);

  // Overall score + rating
  const overall = overallScore(scoreMap);
  const scoreBlock = document.createElement('div');
  scoreBlock.className = 'caf-exec-score-block';
  const bigScore = document.createElement('div');
  bigScore.className = 'caf-exec-big-score';
  bigScore.textContent = overall + '%';
  bigScore.style.color = ratingColor(result.overallRating);
  const rLabel = document.createElement('div');
  rLabel.className = 'caf-exec-rating';
  rLabel.textContent = result.overallRating || 'Not Assessed';
  rLabel.style.color = ratingColor(result.overallRating);
  scoreBlock.appendChild(bigScore);
  scoreBlock.appendChild(rLabel);
  exec.appendChild(scoreBlock);

  // Objective ratings row
  if (result.objectiveRatings) {
    const objRow = document.createElement('div');
    objRow.className = 'caf-exec-objectives';
    const objNames = { A:'Managing Risk', B:'Protecting', C:'Detecting', D:'Minimising Impact' };
    Object.entries(result.objectiveRatings).forEach(([obj, rating]) => {
      const chip = document.createElement('div');
      chip.className = 'caf-exec-obj-chip';
      chip.style.borderColor = ratingColor(rating);
      chip.style.color = ratingColor(rating);
      chip.style.background = ratingColor(rating) + '15';
      chip.textContent = `${obj}: ${objNames[obj] || obj} \u2014 ${rating}`;
      objRow.appendChild(chip);
    });
    exec.appendChild(objRow);
  }

  // Spider chart
  exec.appendChild(buildCAFRadarChart(scoreMap));

  // Top 3 critical gaps
  if (result.criticalGaps && result.criticalGaps.length) {
    const gapsDiv = document.createElement('div');
    gapsDiv.className = 'caf-exec-gaps';
    const gH3 = document.createElement('h3');
    gH3.textContent = 'Key Findings';
    gapsDiv.appendChild(gH3);
    result.criticalGaps.slice(0, 3).forEach(gap => {
      const li = document.createElement('div');
      li.className = 'caf-exec-gap-item';
      li.textContent = typeof gap === 'string' ? gap : gap.action || String(gap);
      gapsDiv.appendChild(li);
    });
    exec.appendChild(gapsDiv);
  }

  // Insert exec summary at the top of results
  content.insertBefore(exec, content.firstChild);

  // ── Print footer ──
  const footer = document.createElement('div');
  footer.id = 'caf-print-footer';
  footer.className = 'caf-print-footer';
  footer.textContent = `CAF Assessment Report \u2014 ${companyName} \u2014 ${new Date().toLocaleDateString('en-GB')} \u2014 Generated by Cyber 3D CAF Assessment Tool`;
  footer.style.display = 'none'; // Shown only in print CSS
  panel.appendChild(footer);

  // Slight delay to let DOM settle before print dialog
  setTimeout(() => window.print(), 200);
}
function exportJSON() {
  const responses = collectResponses();
  const scoreMap  = buildScores(responses);
  const data = { exportedAt: new Date().toISOString(), scores: scoreMap, responses };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'caf-assessment-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}
