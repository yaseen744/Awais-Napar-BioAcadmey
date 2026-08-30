import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      enum: ["Physics", "Chemistry", "Biology", "English", "Logical Reasoning"],
    },
    chapter: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length >= 2 && arr.length <= 5,
        message: "A question needs between 2 and 5 options",
      },
    },
    correctIndex: {
      type: Number,
      required: true,
    },
    source: {
      type: String, // e.g. "DUHS 2022", used for past-paper tagging
      default: "",
    },
    explanation: {
      type: String,
      default: "",
    },
    // Filename of the PDF this question was auto-imported from, if any.
    // Purely informational -- lets the admin see where a question came from.
    pdfSource: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
