import Video from "../models/Video.js";

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
export async function addVideo(req, res) {
  try {
    const { subject, chapter, title, videoUrl, description } = req.body;
    if (!subject || !chapter || !title || !videoUrl) {
      return res.status(400).json({ message: "subject, chapter, title and videoUrl are required." });
    }
    const video = await Video.create({ subject, chapter, title, videoUrl, description });
    return res.status(201).json(video);
  } catch (err) {
    return res.status(500).json({ message: "Could not add video.", error: err.message });
  }
}

// DELETE /api/videos/:id (admin only)
export async function deleteVideo(req, res) {
  try {
    await Video.findByIdAndDelete(req.params.id);
    return res.json({ message: "Video deleted." });
  } catch (err) {
    return res.status(500).json({ message: "Could not delete video.", error: err.message });
  }
}
