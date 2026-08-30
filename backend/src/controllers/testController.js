import mongoose from "mongoose";
import Test from "../models/Test.js";
import Question from "../models/Question.js";

const SUBJECTS = ["Physics", "Chemistry", "Biology", "English", "Logical Reasoning"];

function isAdmin(req) {
  return req.user && req.user.role === "admin";
}

// Strips a Test document down to what a student is allowed to see:
// no question content, just the test's metadata + counts.
function toStudentView(test) {
  return {
    _id: test._id,
    title: test.title,
    subject: test.subject,
    chapter: test.chapter,
    description: test.description,
    selectionMode: test.selectionMode,
    questionsPerAttempt: test.questionsPerAttempt,
    totalAvailableQuestions: test.totalAvailableQuestions,
    duration: test.duration,
    status: test.status,
    isOpen: test.isOpen,
    createdAt: test.createdAt,
    updatedAt: test.updatedAt,
  };
}

// GET /api/tests
// Students: ONLY published + currently open tests. As soon as the admin closes
// a test it disappears from the student list entirely -- it does not stay
// visible as "closed". It reappears automatically the moment it's reopened.
// Admins: everything, including drafts and closed tests (for management).
export async function listTests(req, res) {
  try {
    const filter = isAdmin(req) ? {} : { status: "published", isOpen: true };
    const tests = await Test.find(filter).sort({ createdAt: -1 });
    const payload = isAdmin(req) ? tests : tests.map(toStudentView);
    return res.json(payload);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch tests.", error: err.message });
  }
}

// GET /api/tests/:id
export async function getTest(req, res) {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found." });

    if (!isAdmin(req) && (test.status !== "published" || !test.isOpen)) {
      return res.status(404).json({ message: "Test not found." });
    }

    return res.json(isAdmin(req) ? test : toStudentView(test));
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch test.", error: err.message });
  }
}

// POST /api/tests  (admin only)
// Body: { title, subject, chapter, description, selectionMode, questionsPerAttempt,
//         selectedQuestions?, duration?, source?,
//         bankFilter?: { subject, chapter } }  -- used to auto-pull the question bank
//         OR questionBank?: [ids] to pass an explicit set directly.
export async function createTest(req, res) {
  try {
    const {
      title,
      subject,
      chapter,
      description,
      selectionMode,
      questionsPerAttempt,
      selectedQuestions,
      duration,
      source,
      questionBank,
      bankFilter,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Test title is required." });
    }
    if (!subject || !SUBJECTS.includes(subject)) {
      return res.status(400).json({ message: "A valid subject is required." });
    }

    let bankIds = [];
    if (Array.isArray(questionBank) && questionBank.length > 0) {
      bankIds = questionBank;
    } else if (bankFilter && bankFilter.subject) {
      const matchFilter = { subject: bankFilter.subject };
      if (bankFilter.chapter) matchFilter.chapter = bankFilter.chapter;
      const matched = await Question.find(matchFilter).select("_id");
      bankIds = matched.map((q) => q._id);
    }

    if (bankIds.length === 0) {
      return res.status(400).json({
        message:
          "No questions found for this test's question bank. Import questions first or pick a different subject/chapter.",
      });
    }

    const mode = selectionMode === "specific" ? "specific" : "random";

    const testData = {
      title: title.trim(),
      subject,
      chapter: chapter?.trim() || "Mixed",
      description: description || "",
      questionBank: bankIds,
      selectionMode: mode,
      duration: duration || null,
      source: source || "",
      createdBy: req.user._id,
    };

    if (mode === "random") {
      const perAttempt = Number(questionsPerAttempt);
      if (!Number.isInteger(perAttempt) || perAttempt <= 0) {
        return res.status(400).json({ message: "Questions per attempt must be a positive whole number." });
      }
      if (perAttempt > bankIds.length) {
        return res.status(400).json({
          message: `Questions per attempt (${perAttempt}) cannot exceed the available question bank (${bankIds.length}).`,
        });
      }
      testData.questionsPerAttempt = perAttempt;
    } else {
      if (!Array.isArray(selectedQuestions) || selectedQuestions.length === 0) {
        return res.status(400).json({ message: "Select at least one specific question." });
      }
      const bankSet = new Set(bankIds.map((id) => id.toString()));
      const invalid = selectedQuestions.some((id) => !bankSet.has(id.toString()));
      if (invalid) {
        return res.status(400).json({ message: "Selected questions must belong to the question bank." });
      }
      testData.selectedQuestions = selectedQuestions;
      testData.questionsPerAttempt = selectedQuestions.length;
    }

    const test = await Test.create(testData);
    return res.status(201).json(test);
  } catch (err) {
    return res.status(400).json({ message: err.message || "Could not create test." });
  }
}

// PATCH /api/tests/:id  (admin only) -- edit title/description/mode/counts/etc.
export async function updateTest(req, res) {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found." });

    const editable = [
      "title",
      "chapter",
      "description",
      "selectionMode",
      "questionsPerAttempt",
      "selectedQuestions",
      "duration",
    ];
    editable.forEach((field) => {
      if (req.body[field] !== undefined) test[field] = req.body[field];
    });

    if (Array.isArray(req.body.questionBank) && req.body.questionBank.length > 0) {
      test.questionBank = req.body.questionBank;
    }

    await test.save();
    return res.json(test);
  } catch (err) {
    return res.status(400).json({ message: err.message || "Could not update test." });
  }
}

// DELETE /api/tests/:id  (admin only)
// Does NOT delete past Attempts -- students keep their history/results.
export async function deleteTest(req, res) {
  try {
    const test = await Test.findByIdAndDelete(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found." });
    return res.json({ message: "Test deleted." });
  } catch (err) {
    return res.status(500).json({ message: "Could not delete test.", error: err.message });
  }
}

// PATCH /api/tests/:id/publish   body: { published: true|false }  (admin only)
export async function setPublish(req, res) {
  try {
    const { published } = req.body;
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      { status: published ? "published" : "draft" },
      { new: true }
    );
    if (!test) return res.status(404).json({ message: "Test not found." });
    return res.json(test);
  } catch (err) {
    return res.status(500).json({ message: "Could not update publish state.", error: err.message });
  }
}

// PATCH /api/tests/:id/open  (admin only)
export async function openTest(req, res) {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, { isOpen: true }, { new: true });
    if (!test) return res.status(404).json({ message: "Test not found." });
    return res.json(test);
  } catch (err) {
    return res.status(500).json({ message: "Could not open test.", error: err.message });
  }
}

// PATCH /api/tests/:id/close  (admin only)
export async function closeTest(req, res) {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, { isOpen: false }, { new: true });
    if (!test) return res.status(404).json({ message: "Test not found." });
    return res.json(test);
  } catch (err) {
    return res.status(500).json({ message: "Could not close test.", error: err.message });
  }
}

// POST /api/tests/:id/start  (any authenticated, approved user)
// Selects the configured question set for this attempt and returns it
// WITHOUT correct answers. This is stateless -- grading happens on submit,
// where membership in the test's pool is re-checked server-side.
export async function startTest(req, res) {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found." });

    if (test.status !== "published") {
      return res.status(403).json({ message: "This test is not currently available." });
    }
    if (!test.isOpen) {
      return res.status(403).json({ message: "Test is currently closed." });
    }

    let questionIds;
    if (test.selectionMode === "specific") {
      questionIds = test.selectedQuestions;
    } else {
      // Random sample from the frozen question bank pool.
      const sampled = await Question.aggregate([
        { $match: { _id: { $in: test.questionBank.map((id) => new mongoose.Types.ObjectId(id)) } } },
        { $sample: { size: test.questionsPerAttempt } },
      ]);
      questionIds = sampled.map((q) => q._id);
    }

    const questions = await Question.find({ _id: { $in: questionIds } }).select(
      "text options source subject chapter"
    );

    // Keep the order random/shuffled rather than natural DB order for "specific" mode too,
    // except specific mode should stay in admin-defined order for predictability.
    let ordered = questions;
    if (test.selectionMode === "specific") {
      const orderMap = new Map(test.selectedQuestions.map((id, idx) => [id.toString(), idx]));
      ordered = [...questions].sort(
        (a, b) => orderMap.get(a._id.toString()) - orderMap.get(b._id.toString())
      );
    }

    return res.json({
      testId: test._id,
      title: test.title,
      subject: test.subject,
      chapter: test.chapter,
      duration: test.duration,
      questions: ordered,
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not start test.", error: err.message });
  }
}
