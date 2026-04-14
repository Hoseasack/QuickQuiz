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
const quizAuthor    = document.getElementById('quiz-author');
const quizDesc      = document.getElementById('quiz-description');
const quizCount     = document.getElementById('quiz-count');
const quizForm      = document.getElementById('quiz-form');
const questionList  = document.getElementById('question-list');
const submitBtn     = document.getElementById('submit-btn');
const retakeBtn     = document.getElementById('retake-btn');
const homeBtn       = document.getElementById('home-btn');

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
  const file = fileInput.files[0];


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
  reader.onerror = () => showFileError('Could not read file');
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
  quizAuthor.textContent = `Created by ${quizData.author}`;
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

  const total = renderOrder.length;
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

// ── Retake ────────────────────────────────────────────────────────────────────
retakeBtn.addEventListener('click', () => {
  renderOrder = shuffle(quizData.questions.map((_, i) => i));
  renderQuiz();
});

// ── Home ────────────────────────────────────────────────────────────────────
homeBtn.addEventListener('click', () => [
  dropZone.hidden = false,
  quizView.hidden = true,
  quizData = null,
  renderOrder = [],
  fileInput.value = null,
]);