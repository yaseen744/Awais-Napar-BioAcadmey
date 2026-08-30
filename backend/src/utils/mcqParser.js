// Parses raw text extracted from a PDF into structured MCQ objects.
//
// Expected loose format (tolerant of common variations):
//
//   1. What is the powerhouse of the cell?
//   A. Nucleus
//   B. Mitochondria
//   C. Ribosome
//   D. Golgi body
//   Correct Answer: B
//   Explanation: Mitochondria produce ATP through respiration.
//
// Supports numbering styles like "1.", "1)", "Q1.", "Question 1:" and
// option styles like "A.", "A)", "(A)", "A:".
// Answer line accepts "Correct Answer:", "Answer:", "Ans:", "Correct Option:"
// followed by a letter (A-E) or the full option text.

const QUESTION_START_RE =
  /(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,3})[.).:]\s+/gi;

const OPTION_RE = /(?:^|\n)\s*\(?([A-Ea-e])[.).:]\s+(.+)/g;

const ANSWER_RE =
  /(?:Correct\s*Answer|Correct\s*Option|Answer|Ans)\s*[:.\-]?\s*\(?([A-Ea-e])?\)?\s*(.*)/i;

const EXPLANATION_RE = /(?:Explanation|Reason|Rationale)\s*[:.\-]?\s*(.+)/i;

/**
 * Splits raw PDF text into per-question chunks using the question-number marker.
 */
function splitIntoQuestionBlocks(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\u00A0/g, " ");

  const matches = [...normalized.matchAll(QUESTION_START_RE)];
  if (matches.length === 0) return [];

  const blocks = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : normalized.length;
    const number = matches[i][1];
    blocks.push({ number, raw: normalized.slice(start, end).trim() });
  }
  return blocks;
}

/**
 * Parses a single question block into a structured question, or null if it
 * doesn't look like a valid MCQ (missing options / answer).
 */
function parseBlock(block, index) {
  const lines = block.raw.split("\n").map((l) => l.trim());

  // Strip the leading "1." / "Q1." marker off the first line to get the question text start.
  let firstLine = lines[0].replace(/^(?:Q(?:uestion)?\.?\s*)?\d{1,3}[.).:]\s*/i, "");
  lines[0] = firstLine;

  const optionLines = [];
  const bodyLines = [];
  let answerLine = null;
  let explanationLine = null;

  for (const line of lines) {
    if (!line) continue;

    const optMatch = /^\(?([A-Ea-e])[.).:]\s+(.+)/.exec(line);
    const ansMatch = ANSWER_RE.exec(line);
    const explMatch = EXPLANATION_RE.exec(line);

    if (ansMatch && /^(Correct|Answer|Ans)/i.test(line)) {
      answerLine = ansMatch;
      continue;
    }
    if (explMatch && /^(Explanation|Reason|Rationale)/i.test(line)) {
      explanationLine = explMatch[1];
      continue;
    }
    if (optMatch) {
      optionLines.push({ letter: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
      continue;
    }
    bodyLines.push(line);
  }

  const questionText = bodyLines.join(" ").trim();
  const options = optionLines.map((o) => o.text);
  const optionLetters = optionLines.map((o) => o.letter);

  if (!questionText || options.length < 2) {
    return null; // not a usable MCQ
  }

  let correctIndex = -1;
  if (answerLine) {
    const letter = answerLine[1]?.toUpperCase();
    const restText = (answerLine[2] || "").trim();
    if (letter) {
      correctIndex = optionLetters.indexOf(letter);
    } else if (restText) {
      // Answer given as full text instead of a letter -- match against options.
      correctIndex = options.findIndex(
        (o) => o.toLowerCase() === restText.toLowerCase()
      );
    }
  }

  return {
    tempId: `pdf-${index}`,
    text: questionText,
    options,
    correctIndex, // -1 means "could not detect answer" -> admin must fix before import
    explanation: explanationLine || "",
    needsReview: correctIndex < 0 || options.length < 2,
  };
}

/**
 * Main entry point: raw extracted PDF text -> array of parsed question objects.
 */
export function parseMCQsFromText(text) {
  const blocks = splitIntoQuestionBlocks(text);
  const parsed = [];
  blocks.forEach((block, i) => {
    const q = parseBlock(block, i + 1);
    if (q) parsed.push(q);
  });
  return parsed;
}
