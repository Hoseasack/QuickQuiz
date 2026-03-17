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
