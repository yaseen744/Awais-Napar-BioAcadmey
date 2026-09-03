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
//
// Also tolerates PDFs where two (or more) options land on the SAME extracted
// text line -- common with 2-column/table-style question papers, e.g.
// "A. Nucleus     B. Mitochondria" on one physical line. The old version only
// looked for ONE option marker per line, so the second option's text got
// swallowed into the first option's text instead of becoming its own option.

const QUESTION_START_RE =
  /(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,3})[.).:]\s+/gi;

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
 * Finds EVERY "A. text" / "B) text" / "(C): text" marker in a single line and
 * splits the line's content between consecutive markers, instead of grabbing
 * everything after the first marker. This is what correctly separates two
 * options that ended up on the same physical PDF line.
 * Returns [] if the line has no option markers at all.
 */
function extractOptionsFromLine(line) {
  const markerRe = /\(?([A-Ea-e])[.).:]\s+/g;
  const markers = [...line.matchAll(markerRe)];
  if (markers.length === 0) return [];

  const results = [];
  for (let i = 0; i < markers.length; i++) {
    const contentStart = markers[i].index + markers[i][0].length;
    const contentEnd = i + 1 < markers.length ? markers[i + 1].index : line.length;
    const text = line.slice(contentStart, contentEnd).trim();
    if (text) {
      results.push({ letter: markers[i][1].toUpperCase(), text });
    }
  }
  return results;
}

/**
 * Parses a single question block into a structured question, or null if it
 * doesn't look like a valid MCQ (no options detected at all).
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

    const lineOptions = extractOptionsFromLine(line);
    if (lineOptions.length > 0) {
      optionLines.push(...lineOptions);
      continue;
    }

    bodyLines.push(line);
  }

  const questionText = bodyLines.join(" ").trim();

  // De-duplicate by letter, keeping the first occurrence, in case the same
  // marker gets matched twice (e.g. a stray repeated header line).
  const seenLetters = new Set();
  const dedupedOptions = [];
  for (const o of optionLines) {
    if (seenLetters.has(o.letter)) continue;
    seenLetters.add(o.letter);
    dedupedOptions.push(o);
  }

  const options = dedupedOptions.map((o) => o.text);
  const optionLetters = dedupedOptions.map((o) => o.letter);

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

