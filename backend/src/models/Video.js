import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Paste a YouTube/Vimeo (or any embeddable) URL here
    videoUrl: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Video", videoSchema);
