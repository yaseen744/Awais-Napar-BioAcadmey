import Video from "../models/Video.js";
import { uploadBufferToCloudinary, deleteCloudinaryVideo, isCloudinaryConfigured } from "../config/cloudinary.js";

// GET /api/videos?subject=Biology&chapter=Genetics
export async function getVideos(req, res) {
  try {
    const { subject, chapter } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (chapter) filter.chapter = chapter;

    const videos = await Video.find(filter).sort({ chapter: 1, createdAt: -1 });
    return res.json(videos);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch videos.", error: err.message });
  }
}

// GET /api/videos/meta - subjects -> chapters, for folder-style browsing
export async function getVideoMeta(req, res) {
  try {
    const meta = await Video.aggregate([
      { $group: { _id: { subject: "$subject", chapter: "$chapter" }, count: { $sum: 1 } } },
      {
        $group: {
          _id: "$_id.subject",
          chapters: { $push: { chapter: "$_id.chapter", count: "$count" } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return res.json(meta);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch video folders.", error: err.message });
  }
}

// POST /api/videos (admin only)
// Legacy path: paste a YouTube/Vimeo (or other) URL directly. Kept for backward
// compatibility -- the admin UI now uses /api/videos/upload instead.
export async function addVideo(req, res) {
  try {
    const { subject, chapter, title, videoUrl, description } = req.body;
    if (!subject || !chapter || !title || !videoUrl) {
      return res.status(400).json({ message: "subject, chapter, title and videoUrl are required." });
    }
    const video = await Video.create({
      subject,
      chapter,
      title,
      videoUrl,
      description,
      sourceType: "external",
    });
    return res.status(201).json(video);
  } catch (err) {
    return res.status(500).json({ message: "Could not add video.", error: err.message });
  }
}

// POST /api/videos/upload (admin only, multipart/form-data: video file + subject/chapter/title/description)
// Uploads the video binary to Cloudinary; MongoDB only ever stores the
// resulting URL + metadata, never the binary itself.
export async function uploadVideo(req, res) {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(500).json({
        message:
          "Video storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server.",
      });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No video file was uploaded." });
    }

    const { subject, chapter, title, description } = req.body;
    if (!subject || !chapter || !title) {
      return res.status(400).json({ message: "subject, chapter and title are required." });
    }

    let uploadResult;
    try {
      uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
        public_id: undefined, // let Cloudinary generate one
      });
    } catch (err) {
      return res.status(502).json({ message: "Video upload to cloud storage failed.", error: err.message });
    }

    const video = await Video.create({
      subject,
      chapter,
      title,
      description: description || "",
      videoUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      sourceType: "upload",
      fileSize: req.file.size,
      duration: uploadResult.duration || null,
    });

    return res.status(201).json(video);
  } catch (err) {
    return res.status(500).json({ message: "Could not add video.", error: err.message });
  }
}

// DELETE /api/videos/:id (admin only)
export async function deleteVideo(req, res) {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found." });
    }
    // Clean up the Cloudinary asset too, so storage doesn't leak. Failure here
    // shouldn't block the delete -- the DB record is already gone.
    if (video.sourceType === "upload" && video.publicId) {
      deleteCloudinaryVideo(video.publicId).catch((err) =>
        console.error("Cloudinary cleanup failed:", err.message)
      );
    }
    return res.json({ message: "Video deleted." });
  } catch (err) {
    return res.status(500).json({ message: "Could not delete video.", error: err.message });
  }
}
