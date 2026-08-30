import multer from "multer";

const memoryStorage = multer.memoryStorage();

// PDF question-bank import
export const uploadPdf = multer({
  storage: memoryStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed."));
    }
    cb(null, true);
  },
});

// Lecture video upload
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export const uploadVideoFile = multer({
  storage: memoryStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      return cb(new Error("Only MP4, WebM, or MOV video files are allowed."));
    }
    cb(null, true);
  },
});

// Converts multer errors (file too large, wrong type, etc.) into clean JSON
// responses instead of Express's default HTML error page.
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File is too large." });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message || "Upload failed." });
  }
  next();
}
