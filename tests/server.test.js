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
  assert.equal(res.body.error, 'No quiz content received');
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

test('POST /api/quiz returns 400 when Content-Type is not text/plain', async () => {
  const res = await supertest(app)
    .post('/api/quiz')
    .send('# Quiz\n---\n? Q?\n> A\n');
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'No quiz content received');
});
