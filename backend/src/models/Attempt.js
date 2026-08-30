import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedIndex: { type: Number, default: null }, // null = unattempted
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Optional: set when this attempt belongs to an admin-configured Test
    // (as opposed to the older ad-hoc "pick a subject/chapter" quiz flow).
    test: { type: mongoose.Schema.Types.ObjectId, ref: "Test", default: null },
    subject: { type: String, required: true },
    chapter: { type: String, default: "Mixed" },
    answers: [answerSchema],
    totalQuestions: { type: Number, required: true },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    unattemptedCount: { type: Number, default: 0 },
    scorePercent: { type: Number, default: 0 },
    timeTakenSeconds: { type: Number, default: 0 },
    // Set when the attempt was force-ended by the anti-cheating guard
    // (tab switch / left fullscreen) instead of a normal submit click.
    terminatedReason: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Attempt", attemptSchema);
