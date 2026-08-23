import Attempt from "../models/Attempt.js";
import Question from "../models/Question.js";
import User from "../models/User.js";

// POST /api/attempts
// body: { subject, chapter, timeTakenSeconds, answers: [{ questionId, selectedIndex }] }
export async function submitAttempt(req, res) {
  try {
    const { subject, chapter, timeTakenSeconds, answers } = req.body;

    if (!subject || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "subject and answers[] are required." });
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
      subject,
      chapter: chapter || "Mixed",
      answers: gradedAnswers,
      totalQuestions,
      correctCount,
      incorrectCount,
      unattemptedCount,
      scorePercent,
      timeTakenSeconds: timeTakenSeconds || 0,
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

// GET /api/attempts/:id - full review of one attempt (with correct answers + explanations)
export async function getAttemptDetail(req, res) {
  try {
    const attempt = await Attempt.findOne({ _id: req.params.id, user: req.user._id }).populate(
      "answers.question"
    );
    if (!attempt) {
      return res.status(404).json({ message: "Attempt not found." });
    }
    return res.json(attempt);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch attempt.", error: err.message });
  }
}
