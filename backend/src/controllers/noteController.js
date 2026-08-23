import Note from "../models/Note.js";

export async function getNotes(req, res) {
  try {
    const { subject, chapter } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (chapter) filter.chapter = chapter;

    const notes = await Note.find(filter).sort({ chapter: 1, createdAt: -1 });
    return res.json(notes);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch notes.", error: err.message });
  }
}

export async function getNoteMeta(req, res) {
  try {
    const meta = await Note.aggregate([
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
    return res.status(500).json({ message: "Could not fetch note folders.", error: err.message });
  }
}

export async function addNote(req, res) {
  try {
    const { subject, chapter, title, fileUrl, content } = req.body;
    if (!subject || !chapter || !title || (!fileUrl && !content)) {
      return res
        .status(400)
        .json({ message: "subject, chapter, title and either fileUrl or content are required." });
    }
    const note = await Note.create({ subject, chapter, title, fileUrl, content });
    return res.status(201).json(note);
  } catch (err) {
    return res.status(500).json({ message: "Could not add note.", error: err.message });
  }
}

export async function deleteNote(req, res) {
  try {
    await Note.findByIdAndDelete(req.params.id);
    return res.json({ message: "Note deleted." });
  } catch (err) {
    return res.status(500).json({ message: "Could not delete note.", error: err.message });
  }
}
