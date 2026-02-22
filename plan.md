# Feature: Live Progress Tracker with Section Navigation

## Problem

Users currently have **zero visibility** into their progress while filling out the assessment. The only feedback is a brief "Progress saved" toast in the corner. There is no way to see:
- How many questions have been answered out of the total
- Which sections are complete, partial, or untouched
- Which sections still have unanswered critical questions

Users discover their completion status only after clicking "Analyze", which creates uncertainty and leads to missed sections.

## Proposed Feature

A **sticky progress sidebar** (desktop) / **collapsible progress bar** (mobile) that updates in real-time as the user answers questions. It shows:

1. **Overall progress ring** — circular percentage indicator (e.g., "18 of 34 answered — 53%")
2. **Per-section rows** — one row per control showing: section name, "X/Y" answered count, and a status badge (complete/partial/empty)
3. **Click-to-navigate** — clicking a section row scrolls to that section and expands it if collapsed
4. **Critical question alert** — sections with unanswered critical questions get a small warning icon

The tracker updates on every radio button click and text input change (piggybacks on the existing `debouncedAutoSave` event flow).

## Implementation Plan

### Step 1 — Add progress tracker HTML to `assessment.html`

Insert a `<div class="progress-tracker" id="progress-tracker">` immediately inside `.main-content`, before the first assessment section. Structure:

```
div.progress-tracker
  div.progress-overview          ← overall ring + "X of Y" text
    svg (circular progress ring)
    span.progress-label
  div.progress-sections          ← per-control rows
    div.progress-row[data-target="1"]  ← "Firewalls  6/7  ✓"
    div.progress-row[data-target="2"]  ← "Secure Config  3/6"
    ...up to 7 (supply chain conditional)
```

### Step 2 — Add progress tracker styles to `assessment.css`

**Desktop (≥769px):** Sticky sidebar floated to the right of the assessment form. `position: sticky; top: 20px;` inside a flex/grid layout so the main content narrows slightly.

**Mobile (<769px):** Fixed bottom bar showing only the overall percentage. Tapping it expands a dropdown with the section breakdown.

Key styles:
- Circular SVG progress ring (stroke-dasharray animation)
- Section rows with status colours: green (complete), amber (partial), grey (empty)
- Warning icon for sections with unanswered critical questions
- Smooth transition on percentage changes
- `@media print { .progress-tracker { display: none; } }` — hidden in PDF export

### Step 3 — Add `updateProgressTracker()` function to `assessment.js`

Core logic (new function, ~60 lines):

```
function updateProgressTracker() {
  for each control 1–6 (and 7 if supply chain visible):
    count visible questions with data-control=N
    count answered (checked radio in that control)
    count unanswered critical questions
    update the matching .progress-row badge and count text

  compute overall answered / total
  update SVG ring stroke-dashoffset
  update label text
}
```

This function reads the DOM directly (same pattern as `analyzeAssessment`'s counting logic on lines 398–408) so it stays in sync with conditional branching visibility.

### Step 4 — Hook `updateProgressTracker()` into existing event flow

Three call sites — all already exist, just need one line added to each:

| Location | Existing code | Addition |
|----------|--------------|----------|
| Radio button click handler (~line 36) | calls `debouncedAutoSave()` | also call `updateProgressTracker()` |
| Text input change handler (~line 57) | calls `debouncedAutoSave` | also call `updateProgressTracker()` |
| `loadAssessment()` (~line 135) | restores saved state | call `updateProgressTracker()` after restore |

Also call it once on `window.load` to set the initial state (0/N or restored counts).

### Step 5 — Wire click-to-navigate on section rows

Each `.progress-row` gets `onclick` that:
1. Reads `data-target` attribute (control number)
2. If the target section is collapsed, calls `toggleControl(n)` to expand it
3. Scrolls the section header into view with `scrollIntoView({ behavior: 'smooth', block: 'start' })`

### Step 6 — Update `updateConditionalQuestions()` to refresh tracker

When a conditional follow-up question is shown or hidden (~line 243), call `updateProgressTracker()` so the total count adjusts dynamically.

## Files Changed

| File | Change |
|------|--------|
| `assessment.html` | Add progress tracker `<div>` inside `.main-content`, wrap existing sections in a flex child |
| `assessment.css` | Add ~80 lines: tracker layout, ring, section rows, responsive rules, print hide |
| `assessment.js` | Add `updateProgressTracker()` (~60 lines), add 4–5 one-line calls at existing hook points |

## What This Does NOT Change

- Scoring logic, analysis flow, results display — untouched
- Auto-save — continues to work as-is; tracker piggybacks on the same events
- Supply chain vendor questions — not counted in the tracker (they have separate per-vendor risk scoring)
- PDF export — tracker hidden via `@media print`
