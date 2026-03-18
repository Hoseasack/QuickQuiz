# QuickQuiz

A local web app for taking quizzes from `.quiz` files, plus a Claude skill for converting existing tests and exams into `.quiz` files.

> [!NOTE]
> This project is heavily assisted using Claude Code. Human oversight is present during the use of artificial inteligence. 

## Getting Started

**Requirements:** Node.js 18+

```bash
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

> [!TIP]
> If `npm` outputs errors about `address already in use :::3000`, change the port in `server.js`.

## How It Works

1. Drop a `.quiz` file onto the app (or click to pick one)
2. Answer the questions — multiple choice, true/false, and multi-select are all supported
3. Submit to see your score with inline answer feedback
4. Retake with questions and answers reshuffled

## The `.quiz` Format

Quiz files are plain text. Put them in the `quizzes/` folder.

```
# Quiz Title
author: Required
description: Optional description
warning: Optional banner warning, used by Claude Code skill

---

? Multiple choice question
* Wrong answer
> Correct answer
* Wrong answer

---

? True or false statement [tf]
* True
> False

---

? Select all that apply [multi]
> Correct option
* Wrong option
> Also correct
```

**Preamble fields:**
- `# Title` — displayed as the quiz heading (required)
- `author` - shown below the title (required)
- `description:` — shown below the author (optional)
- `warning:` — shown as a yellow banner warning the user answers may not be official (optional)

**Question syntax:**
- `?` — question text
- `>` — correct answer
- `*` — wrong answer
- `[tf]` — true/false question (radio buttons)
- `[multi]` — select all that apply (checkboxes)
- No tag — standard multiple choice (radio buttons)

See `quizzes/example.quiz` for a complete example.

## Quiz Generator Skill

QuickQuiz includes a Claude Code skill that converts existing tests and exams into `.quiz` files. It faithfully transcribes the source material verbatim — no rephrasing or edits.

**Supported input formats:** `.txt`, `.md`, `.pdf`, images (`.png`, `.jpg`, `.jpeg`, `.webp`)

**To use it in Claude Code:**

```
Skill: quiz-generator
```

Then provide the path to your source file. The skill will:

1. Read the source file
2. Extract all questions and answers verbatim
3. Detect question types automatically (MC, true/false, multi-select)
4. If no answer key is found, prompt you to either upload one or use Claude-generated answers (which adds a `warning:` to the output)
5. Detect the document author automaticly. If no author is found, the user name will be used. If no user name is provided, Claude will be noted as the author.
6. Write the `.quiz` file to `quizzes/`

## Running Tests

```bash
npm test
```

14 tests covering the quiz parser and server API.

## Project Structure

```
quizzes/          # Your .quiz files go here
public/           # Frontend (HTML, CSS, JS)
src/
  quiz-parser.js  # Parses .quiz files into structured data
skills/
  quiz-generator/ # Claude skill for converting exams to .quiz
tests/            # Parser and server tests
server.js         # Express server (POST /api/quiz)
```
