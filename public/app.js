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
