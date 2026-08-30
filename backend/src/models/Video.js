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
    // For uploaded videos this is the Cloudinary secure_url.
    // For legacy/external videos this is a YouTube/Vimeo (or any embeddable) URL.
    videoUrl: {
      type: String,
      required: true,
    },
    // Cloudinary public_id -- only set for uploaded videos. Needed to delete
    // the asset from Cloudinary when the video is removed.
    publicId: {
      type: String,
      default: "",
    },
    // "upload" = hosted on Cloudinary via the file picker, "external" = a pasted
    // YouTube/Vimeo/other link (legacy flow, kept for backward compatibility).
    sourceType: {
      type: String,
      enum: ["upload", "external"],
      default: "external",
    },
    fileSize: {
      type: Number, // bytes, only set for uploaded videos
      default: null,
    },
    duration: {
      type: Number, // seconds, only set for uploaded videos (from Cloudinary)
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Video", videoSchema);
