'use strict';

/**
 * parseQuiz(text) — Parse a .quiz file into a JSON object.
 *
 * @param {string} text - Raw contents of a .quiz file
 * @returns {{ title: string, description: string, warning: string|null, questions: Array }}
 * @throws {Error} Descriptive error message for malformed input
 */
function parseQuiz(text) {
  const rawLines = text.split(/\r?\n/);

  // ── 1. Title (first non-empty line must be "# Title") ─────────────────────
  let titleLineIndex = -1;
  for (let i = 0; i < rawLines.length; i++) {
    if (rawLines[i].trim() !== '') {
      titleLineIndex = i;
      break;
    }
  }

  if (titleLineIndex === -1 || !rawLines[titleLineIndex].trim().startsWith('#')) {
    throw new Error('Missing title: first line must start with #');
  }

  const title = rawLines[titleLineIndex].trim().slice(1).trim();
  if (title === '') throw new Error('Title cannot be empty');

  // ── 2. Collect preamble lines (between title and first ---) ───────────────
  let description = '';
  let warning = null;
  let bodyStartIndex = titleLineIndex + 1;

  for (let i = titleLineIndex + 1; i < rawLines.length; i++) {
    const trimmed = rawLines[i].trim();
    if (trimmed === '---') {
      bodyStartIndex = i + 1;
      break;
    }
    if (trimmed.startsWith('description:')) {
      description = trimmed.slice('description:'.length).trim();
    }
    if (trimmed.startsWith('warning:')) {
      warning = trimmed.slice('warning:'.length).trim();
    }
    // other preamble lines (blank or unknown metadata) are ignored
  }

  // ── 3. Split body into question blocks on --- separators ──────────────────
  const bodyLines = rawLines.slice(bodyStartIndex);

  // Filter out comment lines (lines starting with #) and split on ---
  const blocks = [];
  let current = [];

  for (const line of bodyLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) continue; // comment — skip
    if (trimmed === '---') {
      blocks.push(current);
      current = [];
    } else {
      current.push(line);
    }
  }
  blocks.push(current); // last block (no trailing ---)

  // ── 4. Parse each block into a question ───────────────────────────────────
  const questions = [];

  for (const block of blocks) {
    // Drop blank lines within the block
    const lines = block.map(l => l.trim()).filter(l => l !== '');
    if (lines.length === 0) continue; // empty block between separators

    // First non-blank line must start with ?
    const questionLine = lines[0];
    if (!questionLine.startsWith('?')) continue; // not a question block, skip

    let questionText = questionLine.slice(1).trim();

    // Detect and remove type tag
    let type = 'mc';
    const tfMatch = questionText.match(/\[tf\]\s*$/i);
    const multiMatch = questionText.match(/\[multi\]\s*$/i);

    if (tfMatch) {
      type = 'tf';
      questionText = questionText.slice(0, questionText.length - tfMatch[0].length).trim();
    } else if (multiMatch) {
      type = 'multi';
      questionText = questionText.slice(0, questionText.length - multiMatch[0].length).trim();
    }

    // Parse answer lines
    const answers = [];
    for (let i = 1; i < lines.length; i++) {
      const l = lines[i];
      if (l.startsWith('>')) {
        answers.push({ text: l.slice(1).trim(), correct: true });
      } else if (l.startsWith('*')) {
        answers.push({ text: l.slice(1).trim(), correct: false });
      }
      // any other line inside a block is ignored
    }

    const questionNumber = questions.length + 1; // 1-based for error messages

    // Validate: non-[multi] questions must not have more than one correct answer
    const correctCount = answers.filter(a => a.correct).length;

    if (answers.length === 0) {
      throw new Error(`Question ${questionNumber} has no answer options`);
    }

    if (type !== 'multi' && correctCount > 1) {
      throw new Error(`Question ${questionNumber} has multiple correct answers but is not tagged [multi]`);
    }

    if (correctCount === 0) {
      throw new Error(`Question ${questionNumber} has no correct answer`);
    }

    questions.push({
      id: questions.length, // 0-based id
      type,
      text: questionText,
      answers,
    });
  }

  if (questions.length === 0) {
    throw new Error('No questions found in file');
  }

  return { title, description, warning, questions };
}

module.exports = { parseQuiz };
