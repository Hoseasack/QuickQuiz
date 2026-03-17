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
