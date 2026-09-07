import Question from "../models/Question.js";

// GET /api/questions?subject=Biology&chapter=Biomolecules&limit=20
// Returns a random-ish set of questions for building a test.
export async function getQuestions(req, res) {
  try {
    const { subject, chapter, limit } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (chapter) filter.chapter = chapter;

    const count = parseInt(limit, 10) || 20;

    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: count } },
    ]);

    return res.json(questions);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch questions.", error: err.message });
  }
}

// GET /api/questions/meta -> list of subjects & chapters available, for the test builder UI
export async function getMeta(req, res) {
  try {
    const meta = await Question.aggregate([
      { $group: { _id: { subject: "$subject", chapter: "$chapter" }, count: { $sum: 1 } } },
      {
        $group: {
          _id: "$_id.subject",
          chapters: { $push: { chapter: "$_id.chapter", count: "$count" } },
          total: { $sum: "$count" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return res.json(meta);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch subject/chapter list.", error: err.message });
  }
}

// GET /api/questions/all?subject=Biology&chapter=Biomolecules (admin only)
// Returns the FULL matching set (not a random sample) -- used by the admin
// "specific question selection" UI and the question-bank browser.
export async function getAllQuestions(req, res) {
  try {
    const { subject, chapter, source } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (chapter) filter.chapter = chapter;
    if (source) filter.pdfSource = source;

    const questions = await Question.find(filter).sort({ createdAt: -1 });
    return res.json(questions);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch questions.", error: err.message });
  }
}

// PATCH /api/questions/:id (admin only) -- fix a mistake in an already-imported
// question (wrong correct answer, typo in text/options, etc). This is what
// lets the admin correct answer-key mistakes after import/test creation,
// without having to re-import the whole PDF.
export async function updateQuestion(req, res) {
  try {
    const { text, options, correctIndex, explanation, subject, chapter } = req.body;

    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }

    if (text !== undefined) question.text = text.trim();
    if (Array.isArray(options)) {
      const cleaned = options.map((o) => (o || "").trim()).filter(Boolean);
      if (cleaned.length < 2) {
        return res.status(400).json({ message: "A question needs at least 2 options." });
      }
      question.options = cleaned;
    }
    if (correctIndex !== undefined) {
      const idx = Number(correctIndex);
      if (!Number.isInteger(idx) || idx < 0 || idx >= question.options.length) {
        return res.status(400).json({ message: "correctIndex must point to a valid option." });
      }
      question.correctIndex = idx;
    }
    if (explanation !== undefined) question.explanation = explanation;
    if (subject !== undefined) question.subject = subject;
    if (chapter !== undefined) question.chapter = chapter.trim();

    await question.save();
    return res.json(question);
  } catch (err) {
    return res.status(500).json({ message: "Could not update question.", error: err.message });
  }
}

// DELETE /api/questions/:id (admin only)
// Note: this only removes the question from the shared bank going forward.
// Any Test that already has this question's id baked into its questionBank
// keeps the reference; startTest quietly skips ids that no longer resolve.
export async function deleteQuestion(req, res) {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }
    return res.json({ message: "Question deleted." });
  } catch (err) {
    return res.status(500).json({ message: "Could not delete question.", error: err.message });
  }
}

// POST /api/questions (admin only) - add a single question to the bank
export async function addQuestion(req, res) {
  try {
    const { subject, chapter, text, options, correctIndex, source, explanation } = req.body;
    if (!subject || !chapter || !text || !options || correctIndex === undefined) {
      return res.status(400).json({ message: "subject, chapter, text, options and correctIndex are required." });
    }
    const question = await Question.create({
      subject,
      chapter,
      text,
      options,
      correctIndex,
      source,
      explanation,
    });
    return res.status(201).json(question);
  } catch (err) {
    return res.status(500).json({ message: "Could not add question.", error: err.message });
  }
}
