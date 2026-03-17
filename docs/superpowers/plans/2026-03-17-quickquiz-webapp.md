# QuickQuiz Web App Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Node/Express web app that loads `.quiz` files via drag-and-drop or file picker and renders interactive multiple-choice, true/false, and multiple-select quizzes with inline scoring and shuffled retake.

**Architecture:** Express serves static files from `public/` and exposes a single `POST /api/quiz` endpoint that parses uploaded `.quiz` text server-side and returns JSON. The browser (vanilla JS, no framework, no build step) handles all rendering, scoring, and shuffle logic.

**Tech Stack:** Node.js ≥18, Express 4, supertest (dev), vanilla HTML/CSS/JS.

---

## Working Directory

All work is done in the `feature/quickquiz-build` worktree:
```
.worktrees/quickquiz-build/
```

Run all commands from inside that directory.

---

## File Map

| Path | Action | Responsibility |
|------|--------|----------------|
| `src/quiz-parser.js` | **Modify** | Add `warning` field parsing; update return type |
| `server.js` | **Create** | Express server: static + `POST /api/quiz` |
| `public/index.html` | **Create** | Single-page HTML shell |
| `public/style.css` | **Create** | Minimal UI styles |
| `public/app.js` | **Create** | All client logic: load, render, score, shuffle |
| `tests/quiz-parser.test.js` | **Create** | Parser unit tests |
| `tests/server.test.js` | **Create** | API integration tests |
| `package.json` | **Modify** | Add `test` script + `supertest` devDependency |

---

## Task 1: Test infrastructure

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add test script and supertest devDependency to package.json**

Replace the `scripts` section and add `devDependencies`:

```json
{
  "name": "quickquiz",
  "version": "1.0.0",
  "description": "A local Mac app for taking quizzes from .quiz files",
  "private": true,
  "license": "UNLICENSED",
  "main": "server.js",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "start": "node server.js",
    "test": "node --test tests/*.test.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "supertest": "^6.3.4"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, `supertest` present at `node_modules/supertest/`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add test script and supertest devDependency"
```

---

## Task 2: Extend quiz-parser with `warning` field

**Files:**
- Create: `tests/quiz-parser.test.js`
- Modify: `src/quiz-parser.js`

- [ ] **Step 1: Create the test file**

Create `tests/quiz-parser.test.js`:

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseQuiz } = require('../src/quiz-parser');

const MINIMAL = `# My Quiz
---
? What is 2+2?
* 3
> 4
`;

test('parses title', () => {
  const result = parseQuiz(MINIMAL);
  assert.equal(result.title, 'My Quiz');
});

test('returns null warning when field is absent', () => {
  const result = parseQuiz(MINIMAL);
  assert.equal(result.warning, null);
});

test('parses warning field', () => {
  const text = `# My Quiz
warning: These answers are AI-generated.
---
? What is 2+2?
* 3
> 4
`;
  const result = parseQuiz(text);
  assert.equal(result.warning, 'These answers are AI-generated.');
});

test('parses mc question type', () => {
  const result = parseQuiz(MINIMAL);
  assert.equal(result.questions[0].type, 'mc');
  assert.equal(result.questions[0].answers.length, 2);
  assert.equal(result.questions[0].answers.find(a => a.text === '4').correct, true);
});

test('parses tf question type', () => {
  const text = `# Quiz
---
? The sky is blue. [tf]
> True
* False
`;
  const result = parseQuiz(text);
  assert.equal(result.questions[0].type, 'tf');
});

test('parses multi question type', () => {
  const text = `# Quiz
---
? Pick all primes [multi]
> 2
> 3
* 4
> 5
`;
  const result = parseQuiz(text);
  assert.equal(result.questions[0].type, 'multi');
  assert.equal(result.questions[0].answers.filter(a => a.correct).length, 3);
});

test('throws on missing title', () => {
  assert.throws(() => parseQuiz('   \n  '), /Missing title/);
});

test('throws on no correct answer', () => {
  const text = `# Quiz
---
? Question?
* Wrong
* Also wrong
`;
  assert.throws(() => parseQuiz(text), /no correct answer/i);
});

test('throws on multiple correct answers in non-multi question', () => {
  const text = `# Quiz
---
? Question?
> Right
> Also right
`;
  assert.throws(() => parseQuiz(text), /multiple correct answers/i);
});
```

- [ ] **Step 2: Run tests — expect warning-field test to fail**

```bash
npm test
```

Expected: `parses title`, `parses mc question type`, and the type/throw tests pass (they test existing behaviour). `returns null warning when field is absent` and `parses warning field` **FAIL** because `result.warning` is currently `undefined`.

- [ ] **Step 3: Add `warning` parsing to `src/quiz-parser.js`**

First verify the exact context (the lines should look like this — confirm before editing):

```bash
grep -n "let description" src/quiz-parser.js
# Expected: line ~20:   let description = '';
```

In `parseQuiz`, find the preamble block variable initialisation (just after `let description = ''`):

```javascript
  let description = '';
```

Change to:

```javascript
  let description = '';
  let warning = null;
```

Inside the preamble loop, after the `description:` check:

```javascript
    if (trimmed.startsWith('description:')) {
      description = trimmed.slice('description:'.length).trim();
    }
```

Add:

```javascript
    if (trimmed.startsWith('description:')) {
      description = trimmed.slice('description:'.length).trim();
    }
    if (trimmed.startsWith('warning:')) {
      warning = trimmed.slice('warning:'.length).trim();
    }
```

Update the return statement at the bottom of `parseQuiz`:

```javascript
  return { title, description, questions };
```

Change to:

```javascript
  return { title, description, warning, questions };
```

- [ ] **Step 4: Run tests — all should pass**

```bash
npm test
```

Expected: All 9 tests **PASS**.

- [ ] **Step 5: Commit**

```bash
git add src/quiz-parser.js tests/quiz-parser.test.js
git commit -m "feat: add warning field support to quiz-parser"
```

---

## Task 3: Build the Express server

**Files:**
- Create: `server.js`
- Create: `tests/server.test.js`

- [ ] **Step 1: Create the server test file**

Create `tests/server.test.js`:

```javascript
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');
const app = require('../server');

const VALID_QUIZ = `# Test Quiz
description: For testing
---
? What is 1+1?
* 1
> 2
`;

test('POST /api/quiz returns 200 with parsed quiz', async () => {
  const res = await supertest(app)
    .post('/api/quiz')
    .set('Content-Type', 'text/plain')
    .send(VALID_QUIZ);
  assert.equal(res.status, 200);
  assert.equal(res.body.title, 'Test Quiz');
  assert.equal(res.body.questions.length, 1);
  assert.equal(res.body.warning, null);
});

test('POST /api/quiz returns 400 for invalid quiz', async () => {
  const res = await supertest(app)
    .post('/api/quiz')
    .set('Content-Type', 'text/plain')
    .send('this is not a quiz');
  assert.equal(res.status, 400);
  assert.ok(res.body.error, 'error field should be present');
});

test('POST /api/quiz returns 400 for empty body', async () => {
  const res = await supertest(app)
    .post('/api/quiz')
    .set('Content-Type', 'text/plain')
    .send('');
  assert.equal(res.status, 400);
  assert.ok(res.body.error);
});

test('POST /api/quiz surfaces warning field', async () => {
  const quiz = `# Warned Quiz
warning: AI-generated answers.
---
? Question?
* Wrong
> Right
`;
  const res = await supertest(app)
    .post('/api/quiz')
    .set('Content-Type', 'text/plain')
    .send(quiz);
  assert.equal(res.status, 200);
  assert.equal(res.body.warning, 'AI-generated answers.');
});
```

- [ ] **Step 2: Run tests — server tests should fail (module not found)**

```bash
npm test
```

Expected: server tests fail with `Cannot find module '../server'`.

- [ ] **Step 3: Create `server.js`**

```javascript
'use strict';

const express = require('express');
const path = require('path');
const { parseQuiz } = require('./src/quiz-parser');

const app = express();

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// Accept raw quiz file text
app.use(express.text({ type: 'text/plain', limit: '1mb' }));

app.post('/api/quiz', (req, res) => {
  if (typeof req.body !== 'string' || req.body.trim() === '') {
    return res.status(400).json({ error: 'No quiz content received' });
  }
  try {
    const result = parseQuiz(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Export app for testing; only bind port when run directly
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`QuickQuiz running at http://localhost:${PORT}`);
  });
}
```

- [ ] **Step 4: Run all tests — all should pass**

```bash
npm test
```

Expected: All 13 tests (9 parser + 4 server) **PASS**.

- [ ] **Step 5: Commit**

```bash
git add server.js tests/server.test.js
git commit -m "feat: add Express server with POST /api/quiz endpoint"
```

---

## Task 4: HTML shell

**Files:**
- Create: `public/index.html`

- [ ] **Step 1: Create `public/index.html`**

```bash
mkdir -p public
```

Create `public/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuickQuiz</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">

    <!-- Drop zone: shown when no quiz is loaded -->
    <div id="drop-zone">
      <p class="drop-zone__heading">Drop a <code>.quiz</code> file here</p>
      <p class="drop-zone__or">or</p>
      <label for="file-input" class="btn">Choose File</label>
      <input type="file" id="file-input" accept=".quiz" hidden>
      <p id="file-error" class="error" hidden></p>
    </div>

    <!-- Quiz view: shown when a quiz is loaded -->
    <div id="quiz-view" hidden>
      <div id="score-banner" class="score-banner" hidden></div>
      <div id="warning-banner" class="warning-banner" hidden></div>

      <header id="quiz-header">
        <h1 id="quiz-title"></h1>
        <p id="quiz-description"></p>
        <p id="quiz-count"></p>
      </header>

      <form id="quiz-form">
        <ol id="question-list"></ol>
        <div id="quiz-actions">
          <button type="submit" id="submit-btn" disabled>Submit</button>
          <button type="button" id="retake-btn" hidden>Retake</button>
        </div>
      </form>
    </div>

  </div>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Smoke-test the HTML shell**

```bash
npm start
```

Open `http://localhost:3000` in a browser. Expected: drop zone renders (unstyled is fine). No console errors. Stop with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add public/index.html
git commit -m "feat: add HTML shell with drop zone and quiz view"
```

---

## Task 5: Styles

**Files:**
- Create: `public/style.css`

- [ ] **Step 1: Create `public/style.css`**

```css
*, *::before, *::after { box-sizing: border-box; }

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f5f5f5;
  color: #222;
  margin: 0;
  padding: 1.5rem 1rem;
}

#app {
  max-width: 760px;
  margin: 0 auto;
}

/* ── Drop zone ─────────────────────────────────────────────────────────────── */

#drop-zone {
  border: 2px dashed #aaa;
  border-radius: 10px;
  padding: 4rem 2rem;
  text-align: center;
  background: #fff;
  transition: border-color 0.15s, background 0.15s;
}

#drop-zone.drag-over {
  border-color: #4f46e5;
  background: #eef2ff;
}

.drop-zone__heading {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.drop-zone__or {
  color: #888;
  margin: 0.5rem 0;
}

.btn {
  display: inline-block;
  background: #4f46e5;
  color: #fff;
  padding: 0.55rem 1.4rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
}

.error {
  color: #dc2626;
  margin-top: 0.75rem;
  font-size: 0.9rem;
}

/* ── Banners ───────────────────────────────────────────────────────────────── */

.score-banner {
  background: #dbeafe;
  border: 1px solid #3b82f6;
  border-radius: 8px;
  padding: 0.85rem 1.1rem;
  margin-bottom: 1rem;
  font-weight: 700;
  font-size: 1.1rem;
}

.score-banner--perfect {
  background: #dcfce7;
  border-color: #22c55e;
}

.warning-banner {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

/* ── Quiz header ───────────────────────────────────────────────────────────── */

#quiz-header {
  margin-bottom: 1.5rem;
}

#quiz-title  { margin: 0 0 0.25rem; font-size: 1.6rem; }
#quiz-description { color: #555; margin: 0 0 0.2rem; }
#quiz-count  { color: #888; font-size: 0.85rem; margin: 0; }

/* ── Question list ─────────────────────────────────────────────────────────── */

#question-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question {
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  transition: border-color 0.2s;
}

/* Continuously highlight unanswered questions */
.question.unanswered {
  border-color: #f59e0b;
}

.question--correct  { border-color: #22c55e; }
.question--incorrect { border-color: #ef4444; }

.question__text {
  font-weight: 600;
  margin: 0 0 0.75rem;
  line-height: 1.4;
}

/* ── Answer options ────────────────────────────────────────────────────────── */

.answer {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.3rem 0;
  cursor: pointer;
  line-height: 1.4;
}

.answer input { margin-top: 0.2rem; flex-shrink: 0; }

.answer--correct { color: #16a34a; font-weight: 600; }
.answer--wrong   { color: #dc2626; text-decoration: line-through; }

/* ── Actions ───────────────────────────────────────────────────────────────── */

#quiz-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 0.75rem;
}

button {
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
}

#submit-btn { background: #4f46e5; color: #fff; }
#submit-btn:disabled { background: #a5b4fc; cursor: not-allowed; }

#retake-btn { background: #e5e7eb; color: #374151; }
#retake-btn:hover { background: #d1d5db; }
```

- [ ] **Step 2: Commit**

```bash
git add public/style.css
git commit -m "feat: add quiz UI styles"
```

---

## Task 6: Client JS — file loading

**Files:**
- Create: `public/app.js`

- [ ] **Step 1: Create `public/app.js` with file-loading logic**

```javascript
'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
let quizData = null;      // parsed quiz JSON returned from server
let renderOrder = [];     // question indices in current display order

// ── DOM refs ──────────────────────────────────────────────────────────────────
const dropZone      = document.getElementById('drop-zone');
const fileInput     = document.getElementById('file-input');
const fileError     = document.getElementById('file-error');
const quizView      = document.getElementById('quiz-view');
const scoreBanner   = document.getElementById('score-banner');
const warningBanner = document.getElementById('warning-banner');
const quizTitle     = document.getElementById('quiz-title');
const quizDesc      = document.getElementById('quiz-description');
const quizCount     = document.getElementById('quiz-count');
const quizForm      = document.getElementById('quiz-form');
const questionList  = document.getElementById('question-list');
const submitBtn     = document.getElementById('submit-btn');
const retakeBtn     = document.getElementById('retake-btn');

// ── Drag-and-drop ─────────────────────────────────────────────────────────────
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});

// ── File picker ───────────────────────────────────────────────────────────────
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) loadFile(fileInput.files[0]);
});

// ── File loading ──────────────────────────────────────────────────────────────
function loadFile(file) {
  if (!file.name.endsWith('.quiz')) {
    showFileError('Please use a .quiz file');
    return;
  }
  hideFileError();

  const reader = new FileReader();
  reader.onload = async e => {
    await submitQuizText(e.target.result);
  };
  reader.readAsText(file);
}

async function submitQuizText(text) {
  try {
    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: text,
    });
    const data = await res.json();
    if (!res.ok) {
      showFileError(data.error || 'Failed to parse quiz');
      return;
    }
    quizData = data;
    startQuiz();
  } catch {
    showFileError('Server error — is the server running?');
  }
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showFileError(msg) {
  fileError.textContent = msg;
  fileError.hidden = false;
}

function hideFileError() {
  fileError.hidden = true;
  fileError.textContent = '';
}

// Rendering, scoring, and retake added in subsequent tasks
function startQuiz() { /* stub — filled in Task 7 */ }
```

- [ ] **Step 2: Smoke-test file loading**

> `quizzes/example.quiz` is already committed in the worktree — confirm with `ls quizzes/`.

```bash
npm start
```

Open `http://localhost:3000`. Drop `quizzes/example.quiz` onto the drop zone. Expected: no console error (startQuiz is a stub, nothing renders yet). Try dropping a `.txt` file — error message should appear.

- [ ] **Step 3: Commit**

```bash
git add public/app.js
git commit -m "feat: add file drop/pick loading and API call in app.js"
```

---

## Task 7: Client JS — question rendering

**Files:**
- Modify: `public/app.js`

- [ ] **Step 1: Replace the `startQuiz` stub with full rendering**

Replace:

```javascript
// Rendering, scoring, and retake added in subsequent tasks
function startQuiz() { /* stub — filled in Task 7 */ }
```

With:

```javascript
// ── Quiz rendering ────────────────────────────────────────────────────────────
function startQuiz() {
  renderOrder = shuffle(quizData.questions.map((_, i) => i));
  renderQuiz();
}

function renderQuiz() {
  // Reset state
  scoreBanner.hidden = true;
  scoreBanner.className = 'score-banner';
  retakeBtn.hidden = true;
  submitBtn.hidden = false;
  submitBtn.disabled = true;
  questionList.innerHTML = '';

  // Header
  quizTitle.textContent = quizData.title;
  quizDesc.textContent = quizData.description || '';
  quizCount.textContent = `${quizData.questions.length} question${quizData.questions.length !== 1 ? 's' : ''}`;

  // Warning banner
  if (quizData.warning) {
    warningBanner.textContent = `⚠️ ${quizData.warning}`;
    warningBanner.hidden = false;
  } else {
    warningBanner.hidden = true;
  }

  // Render questions in shuffled order
  renderOrder.forEach((qIdx, displayIdx) => {
    const q = quizData.questions[qIdx];
    const answerOrder = shuffle(q.answers.map((_, i) => i));
    questionList.appendChild(buildQuestionEl(q, displayIdx + 1, answerOrder));
  });

  dropZone.hidden = true;
  quizView.hidden = false;
  updateSubmitState();
}

function buildQuestionEl(q, num, answerOrder) {
  const li = document.createElement('li');
  li.className = `question question--${q.type} unanswered`;
  li.dataset.id = q.id;

  const p = document.createElement('p');
  p.className = 'question__text';
  p.textContent = `${num}. ${q.text}`;
  li.appendChild(p);

  const inputType = q.type === 'multi' ? 'checkbox' : 'radio';
  const groupName = `q${q.id}`;

  answerOrder.forEach(aIdx => {
    const answer = q.answers[aIdx];
    const label = document.createElement('label');
    label.className = 'answer';

    const input = document.createElement('input');
    input.type = inputType;
    input.name = groupName;
    input.value = String(aIdx);
    input.dataset.correct = String(answer.correct);
    input.addEventListener('change', updateSubmitState);

    label.appendChild(input);
    label.appendChild(document.createTextNode(' ' + answer.text));
    li.appendChild(label);
  });

  return li;
}

function updateSubmitState() {
  let allAnswered = true;
  questionList.querySelectorAll('.question').forEach(qEl => {
    const answered = Array.from(qEl.querySelectorAll('input')).some(i => i.checked);
    qEl.classList.toggle('unanswered', !answered);
    if (!answered) allAnswered = false;
  });
  submitBtn.disabled = !allAnswered;
}
```

- [ ] **Step 2: Smoke-test rendering**

```bash
npm start
```

Drop `quizzes/example.quiz`. Expected: quiz title renders, all 3 questions appear with correct input types (radio for MC/TF, checkboxes for multi). Unanswered questions have an amber border. Submit is disabled.

- [ ] **Step 3: Commit**

```bash
git add public/app.js
git commit -m "feat: render quiz questions with MC, TF, and multi-select inputs"
```

---

## Task 8: Client JS — scoring and inline feedback

**Files:**
- Modify: `public/app.js`

- [ ] **Step 1: Add scoring logic after `updateSubmitState`**

Append to `public/app.js`:

```javascript
// ── Scoring ───────────────────────────────────────────────────────────────────
quizForm.addEventListener('submit', e => {
  e.preventDefault();
  scoreQuiz();
});

function scoreQuiz() {
  // Lock all inputs
  quizForm.querySelectorAll('input').forEach(i => { i.disabled = true; });

  let correct = 0;
  questionList.querySelectorAll('.question').forEach(qEl => {
    if (scoreQuestion(qEl)) correct++;
  });

  const total = quizData.questions.length;
  const pct = Math.round((correct / total) * 100);
  scoreBanner.textContent = `${correct} / ${total} correct (${pct}%)`;
  if (correct === total) scoreBanner.classList.add('score-banner--perfect');
  scoreBanner.hidden = false;

  submitBtn.hidden = true;
  retakeBtn.hidden = false;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scoreQuestion(qEl) {
  const inputs = Array.from(qEl.querySelectorAll('input'));
  // Correct if every input's checked state matches its correct flag
  const allMatch = inputs.every(input => input.checked === (input.dataset.correct === 'true'));

  qEl.classList.remove('unanswered');
  if (allMatch) {
    qEl.classList.add('question--correct');
  } else {
    qEl.classList.add('question--incorrect');
    inputs.forEach(input => {
      const label = input.closest('label');
      if (input.dataset.correct === 'true') {
        label.classList.add('answer--correct');
      } else if (input.checked) {
        label.classList.add('answer--wrong');
      }
    });
  }
  return allMatch;
}
```

- [ ] **Step 2: Smoke-test scoring**

```bash
npm start
```

Load `quizzes/example.quiz`. Answer all questions, click Submit. Expected:
- Score banner appears at the top
- Correct answers highlighted green, wrong answers red with strikethrough
- Correct answers revealed on questions you got wrong
- All inputs disabled
- Retake button appears, Submit hidden

- [ ] **Step 3: Commit**

```bash
git add public/app.js
git commit -m "feat: add inline scoring and answer feedback"
```

---

## Task 9: Client JS — retake with shuffle

**Files:**
- Modify: `public/app.js`

- [ ] **Step 1: Add retake listener after the scoring block**

Append to `public/app.js`:

```javascript
// ── Retake ────────────────────────────────────────────────────────────────────
retakeBtn.addEventListener('click', () => {
  renderOrder = shuffle(renderOrder); // re-shuffle question order
  renderQuiz();                       // renderQuiz also shuffles answers per question
});
```

- [ ] **Step 2: Smoke-test retake**

```bash
npm start
```

Complete a quiz, click Retake. Expected: questions appear in a different order, answer options within questions are reshuffled, all inputs reset, amber borders on unanswered questions return, Submit disabled again.

- [ ] **Step 3: Run full test suite to confirm nothing broken**

```bash
npm test
```

Expected: All 13 tests **PASS**.

- [ ] **Step 4: Commit**

```bash
git add public/app.js
git commit -m "feat: add retake with shuffled questions and answers"
```

---

## Task 10: Final integration smoke test

- [ ] **Step 1: Test with the example quiz end-to-end**

```bash
npm start
```

Open `http://localhost:3000`. Work through this checklist:

| Action | Expected |
|--------|----------|
| Drop `quizzes/example.quiz` | Quiz loads: title, description, 3 questions |
| Question 1 | Radio buttons (MC) |
| Question 2 | Radio buttons with True/False options (TF) |
| Question 3 | Checkboxes (multi-select) |
| Attempt to submit before answering all | Submit stays disabled; unanswered questions have amber border |
| Answer all, submit | Score banner appears; correct = green, wrong = red + correct shown |
| Click Retake | Questions and answers shuffled; clean state |
| Drop a `.txt` file | Error: "Please use a .quiz file" |
| Drop a malformed `.quiz` | Parser error message shown inline |

- [ ] **Step 2: Run full test suite one final time**

```bash
npm test
```

Expected: All 13 tests **PASS**, no warnings.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete QuickQuiz web app"
```
