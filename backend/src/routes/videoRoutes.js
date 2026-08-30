import express from "express";
import { getVideos, getVideoMeta, addVideo, uploadVideo, deleteVideo } from "../controllers/videoController.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { uploadVideoFile, handleUploadError } from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.get("/", getVideos);
router.get("/meta", getVideoMeta);
router.post("/", adminOnly, addVideo);
router.post("/upload", adminOnly, uploadVideoFile.single("video"), handleUploadError, uploadVideo);
router.delete("/:id", adminOnly, deleteVideo);

export default router;
