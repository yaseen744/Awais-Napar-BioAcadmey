import Question from "../models/Question.js";
import { parseMCQsFromText } from "../utils/mcqParser.js";

const SUBJECTS = ["Physics", "Chemistry", "Biology", "English", "Logical Reasoning"];

// POST /api/tests/import-pdf  (admin, multipart/form-data: pdf file + subject + chapter)
// Extracts text from the PDF and parses it into MCQs for admin preview.
// Nothing is saved to MongoDB here.
export async function extractPdf(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF file was uploaded." });
    }

    let rawText = "";
    try {
      // Loaded here (not at the top of the file) on purpose: pdf-parse pulls
      // in pdfjs-dist, which tries to optionally load a native "canvas"
      // package that isn't available in Vercel's serverless environment.
      // Importing it at the top of the file would crash EVERY route on cold
      // start; importing it only when this endpoint is actually hit means
      // the rest of the app (auth, tests, videos, notes...) keeps working
      // even if this one PDF-import feature can't load.
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: req.file.buffer });
      const result = await parser.getText();
      rawText = result.text || "";
      await parser.destroy();
    } catch (err) {
      return res.status(400).json({
        message: "Could not read this PDF. It may be corrupted or password-protected.",
      });
    }

    // pdf-parse inserts "-- N of M --" markers between pages; strip those out
    // so they don't get glued onto the last line of a page's question text.
    const text = rawText
      .split("\n")
      .filter((line) => !/^--\s*\d+\s*of\s*\d+\s*--$/.test(line.trim()))
      .join("\n")
      .trim();

    if (!text || text.length < 20) {
      return res.status(422).json({
        message:
          "This PDF appears to be scanned/image-based. Text could not be extracted.",
        scanned: true,
      });
    }

    const questions = parseMCQsFromText(text);

    if (questions.length === 0) {
      return res.status(422).json({
        message:
          "No multiple-choice questions could be detected in this PDF. Make sure each question has numbered options (A, B, C, D) and try again.",
      });
    }

    const needsReviewCount = questions.filter((q) => q.needsReview).length;

    return res.json({
      filename: req.file.originalname,
      totalDetected: questions.length,
      needsReviewCount,
      questions,
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not process the PDF.", error: err.message });
  }
}

// POST /api/questions/import  (admin)
// Body: { subject, chapter, source, questions: [{ text, options, correctIndex, explanation }] }
// Only called after the admin has reviewed/edited the preview and clicked "Import Questions".
export async function importQuestions(req, res) {
  try {
    const { subject, chapter, source, questions } = req.body;

    if (!subject || !SUBJECTS.includes(subject)) {
      return res.status(400).json({ message: "A valid subject is required." });
    }
    if (!chapter || !chapter.trim()) {
      return res.status(400).json({ message: "Chapter is required." });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "At least one question is required to import." });
    }

    const cleanQuestions = [];
    const errors = [];

    questions.forEach((q, idx) => {
      const text = (q.text || "").trim();
      const options = Array.isArray(q.options) ? q.options.map((o) => (o || "").trim()).filter(Boolean) : [];
      const correctIndex = Number(q.correctIndex);

      if (!text) {
        errors.push(`Question ${idx + 1}: missing question text.`);
        return;
      }
      if (options.length < 2) {
        errors.push(`Question ${idx + 1}: needs at least 2 options.`);
        return;
      }
      if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
        errors.push(`Question ${idx + 1}: correct answer is missing or invalid.`);
        return;
      }

      cleanQuestions.push({
        subject,
        chapter: chapter.trim(),
        text,
        options,
        correctIndex,
        explanation: (q.explanation || "").trim(),
        source: (q.source || "").trim(),
        pdfSource: source || "",
      });
    });

    if (cleanQuestions.length === 0) {
      return res.status(400).json({
        message: "None of the submitted questions were valid.",
        errors,
      });
    }

    const created = await Question.insertMany(cleanQuestions);

    return res.status(201).json({
      imported: created.length,
      skipped: questions.length - cleanQuestions.length,
      errors,
      questions: created,
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not import questions.", error: err.message });
  }
}
