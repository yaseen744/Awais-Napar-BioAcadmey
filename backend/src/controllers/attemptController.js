import Attempt from "../models/Attempt.js";
import Question from "../models/Question.js";
import Test from "../models/Test.js";
import User from "../models/User.js";

// POST /api/attempts
// body: { subject, chapter, timeTakenSeconds, answers: [{ questionId, selectedIndex }], testId? }
// testId is optional -- present when this attempt belongs to an admin-configured Test
// (as opposed to the older ad-hoc "pick a subject/chapter" quiz flow).
export async function submitAttempt(req, res) {
  try {
    const { subject, chapter, timeTakenSeconds, answers, testId, terminatedReason } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "answers[] are required." });
    }

    let test = null;
    let resolvedSubject = subject;
    let resolvedChapter = chapter;

    // --- Server-side access control for test-based attempts ---
    // Never trust the frontend: re-verify the test is published + open, and
    // that every submitted question actually belongs to this test's pool,
    // right at submission time (not just when "start" was called).
    if (testId) {
      test = await Test.findById(testId);
      if (!test) {
        return res.status(404).json({ message: "Test not found." });
      }
      if (test.status !== "published") {
        return res.status(403).json({ message: "This test is not currently available." });
      }
      if (!test.isOpen) {
        return res.status(403).json({ message: "Test is currently closed." });
      }

      const allowedIds = new Set(
        (test.selectionMode === "specific" ? test.selectedQuestions : test.questionBank).map((id) =>
          id.toString()
        )
      );
      const hasForeignQuestion = answers.some((a) => !allowedIds.has(String(a.questionId)));
      if (hasForeignQuestion) {
        return res.status(400).json({ message: "Submitted answers do not match this test's questions." });
      }

      resolvedSubject = test.subject;
      resolvedChapter = test.chapter;
    }

    if (!resolvedSubject) {
      return res.status(400).json({ message: "subject is required." });
    }

    const questionIds = answers.map((a) => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    const gradedAnswers = answers.map((a) => {
      const q = questionMap.get(a.questionId);
      const selectedIndex =
        a.selectedIndex === undefined || a.selectedIndex === null ? null : a.selectedIndex;

      if (selectedIndex === null) {
        unattemptedCount++;
        return { question: a.questionId, selectedIndex: null, isCorrect: false };
      }

      const isCorrect = q ? q.correctIndex === selectedIndex : false;
      if (isCorrect) correctCount++;
      else incorrectCount++;

      return { question: a.questionId, selectedIndex, isCorrect };
    });

    const totalQuestions = answers.length;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);

    const attempt = await Attempt.create({
      user: req.user._id,
      test: test ? test._id : null,
      subject: resolvedSubject,
      chapter: resolvedChapter || "Mixed",
      answers: gradedAnswers,
      totalQuestions,
      correctCount,
      incorrectCount,
      unattemptedCount,
      scorePercent,
      timeTakenSeconds: timeTakenSeconds || 0,
      terminatedReason: terminatedReason || null,
    });

    // Award points: +1 per correct answer, no penalty for wrong/skipped.
    // This is what feeds the leaderboard.
    if (correctCount > 0) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { points: correctCount } });
    }

    return res.status(201).json(attempt);
  } catch (err) {
    return res.status(500).json({ message: "Could not submit attempt.", error: err.message });
  }
}

// GET /api/attempts/me - a student's own test history
export async function getMyAttempts(req, res) {
  try {
    const attempts = await Attempt.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(attempts);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch attempts.", error: err.message });
  }
}

// GET /api/attempts (admin only) - recent attempts across ALL students, for the
// admin dashboard / oversight. Populates the student's name+email and the
// test title (if it belongs to an admin-configured Test) so the admin can see
// who took what without an extra click.
export async function getAllAttempts(req, res) {
  try {
    const { limit } = req.query;
    const count = Math.min(parseInt(limit, 10) || 100, 300);

    const attempts = await Attempt.find({})
      .sort({ createdAt: -1 })
      .limit(count)
      .populate("user", "name email")
      .populate("test", "title");

    return res.json(attempts);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch attempts.", error: err.message });
  }
}

// GET /api/tests/:testId/attempts (admin only) - every attempt made on one
// specific test, with student name/email, for the Admin Tests panel.
export async function getAttemptsForTest(req, res) {
  try {
    const attempts = await Attempt.find({ test: req.params.testId })
      .sort({ createdAt: -1 })
      .populate("user", "name email");
    return res.json(attempts);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch attempts.", error: err.message });
  }
}

// GET /api/attempts/:id - full review of one attempt (with correct answers + explanations).
// Students can only view their own attempts. Admins can view ANY student's
// attempt (needed for the "who took this test and how did they do" views).
export async function getAttemptDetail(req, res) {
  try {
    const filter =
      req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };

    const attempt = await Attempt.findOne(filter)
      .populate("answers.question")
      .populate("user", "name email")
      .populate("test", "title");

    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found." });
    }
    return res.json(attempt);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch attempt.", error: err.message });
  }
}
