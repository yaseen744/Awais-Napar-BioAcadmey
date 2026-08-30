import mongoose from "mongoose";

// A "Test" is a configured quiz built on top of the shared Question bank.
// It does NOT store question content itself -- it references Question docs,
// so the same imported questions can be reused across multiple tests.
const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      enum: ["Physics", "Chemistry", "Biology", "English", "Logical Reasoning"],
    },
    chapter: {
      type: String,
      default: "Mixed",
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },

    // The full pool of questions this test draws from (frozen at creation/edit time
    // so the test doesn't silently change size if the question bank grows later).
    questionBank: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "A test needs at least one question in its question bank.",
      },
    },

    // "random"  -> each attempt gets `questionsPerAttempt` random questions from questionBank
    // "specific" -> every attempt gets exactly `selectedQuestions`, in order
    selectionMode: {
      type: String,
      enum: ["random", "specific"],
      default: "random",
    },

    // Only used when selectionMode === "random"
    questionsPerAttempt: {
      type: Number,
      default: null,
      validate: {
        validator: function (v) {
          if (this.selectionMode !== "random") return true;
          return Number.isInteger(v) && v > 0;
        },
        message: "Questions per attempt must be a positive whole number for random tests.",
      },
    },

    // Only used when selectionMode === "specific" -- must be a subset of questionBank
    selectedQuestions: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
      default: [],
    },

    // Snapshot of questionBank.length, kept in sync in pre-save so the admin
    // dashboard and validation don't need to re-count on every read.
    totalAvailableQuestions: {
      type: Number,
      default: 0,
    },

    duration: {
      type: Number, // minutes, optional
      default: null,
    },

    // draft -> invisible to students
    // published -> visible to students (attemptable only if also isOpen)
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    // Independent of status: a published test can still be closed so students
    // can see it but cannot start new attempts.
    isOpen: {
      type: Boolean,
      default: false,
    },

    // Optional provenance, e.g. the PDF filename this bank came from
    source: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

testSchema.pre("validate", function (next) {
  this.totalAvailableQuestions = this.questionBank ? this.questionBank.length : 0;

  if (this.selectionMode === "random") {
    if (this.questionsPerAttempt && this.questionsPerAttempt > this.totalAvailableQuestions) {
      return next(
        new Error(
          `Questions per attempt (${this.questionsPerAttempt}) cannot exceed the available question bank (${this.totalAvailableQuestions}).`
        )
      );
    }
  }

  if (this.selectionMode === "specific") {
    if (!this.selectedQuestions || this.selectedQuestions.length === 0) {
      return next(new Error("Specific selection mode requires at least one selected question."));
    }
    const bankIds = new Set(this.questionBank.map((id) => id.toString()));
    const outside = this.selectedQuestions.some((id) => !bankIds.has(id.toString()));
    if (outside) {
      return next(new Error("Selected questions must all belong to the test's question bank."));
    }
  }

  next();
});

export default mongoose.model("Test", testSchema);
