'use strict';

// ─────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────
const STORAGE_KEY = 'caf_assessment_v1';
const SECTION_IDS = ['A1','A2','A3','A4','B1','B2','B3','B4','B5','B6','C1','C2','D1','D2'];
const SECTION_COUNTS = { A1:6, A2:4, A3:3, A4:4, B1:4, B2:8, B3:10, B4:8, B5:6, B6:4, C1:12, C2:4, D1:6, D2:4 };
const TOTAL_QUESTIONS = Object.values(SECTION_COUNTS).reduce((a,b) => a+b, 0);
const CIRCUMFERENCE = 2 * Math.PI * 34; // ring radius = 34

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
//  Auto-save
// ─────────────────────────────────────────
let saveTimer = null;
function attachAutoSave() {
  document.querySelectorAll('input[type="radio"]').forEach(el => {
    el.addEventListener('change', scheduleSave);
  });
}
function scheduleSave() {
  clearTimeout(saveTimer);
  document.getElementById('save-status').textContent = 'Saving\u2026';
  saveTimer = setTimeout(() => {
    saveState();
    document.getElementById('save-status').textContent = 'All changes saved';
  }, 800);
}
function saveState() {
  const state = {};
  document.querySelectorAll('input[type="radio"]:checked').forEach(el => {
    state[el.name] = el.value;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateProgress();
}
function loadSaved() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    Object.entries(state).forEach(([name, value]) => {
      const el = document.querySelector(`input[name="${name}"][value="${value}"]`);
      if (el) el.checked = true;
    });
  } catch (e) { /* ignore corrupt state */ }
}
function clearAll() {
  if (!confirm('Clear all answers? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  document.querySelectorAll('input[type="radio"]:checked').forEach(el => { el.checked = false; });
  document.querySelectorAll('.consultant-response').forEach(el => {
    el.classList.remove('visible');
    el.textContent = '';
  });
  updateProgress();
  document.getElementById('save-status').textContent = 'Cleared';
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
    const resp = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!resp.ok) throw new Error('API ' + resp.status);
    const data = await resp.json();
    const text = data.content?.[0]?.text || data.result || 'No response received.';
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
    const resp = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!resp.ok) throw new Error('API ' + resp.status);
    const data = await resp.json();
    const text = data.content?.[0]?.text || data.result || '';
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
    if (btn) { btn.disabled = false; btn.textContent = 'Analyse with Claude \u2192'; }
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
  const sectionSummary = SECTION_IDS.map(id => {
    const s = scoreMap[id];
    return `${id}: ${s !== null ? s + '%' : 'not attempted'}`;
  }).join(', ');

  const lowSections = SECTION_IDS
    .filter(id => scoreMap[id] !== null && scoreMap[id] < 50)
    .map(id => id);

  return `You are a NCSC Cyber Assessment Framework (CAF) v4.0 assessor analysing a UK organisation's self-assessment results.

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
    regulatoryNote: 'Review NIS Regulations compliance obligations relevant to your sector.'
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

function displayResults(result, scoreMap) {
  const panel   = document.getElementById('results-panel');
  const content = document.getElementById('results-content');
  content.innerHTML = '';

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

  // Section score grid
  const grid = document.createElement('div');
  grid.className = 'results-grid';
  SECTION_IDS.forEach(id => {
    const s = scoreMap[id];
    const card = document.createElement('div');
    card.className = 'principle-card';
    const title = document.createElement('div');
    title.className = 'principle-card-title';
    title.textContent = id;
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
//  Export
// ─────────────────────────────────────────
function exportPDF() {
  window.print();
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
