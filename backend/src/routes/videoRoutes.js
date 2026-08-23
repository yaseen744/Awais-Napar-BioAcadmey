import express from "express";
import { getVideos, getVideoMeta, addVideo, deleteVideo } from "../controllers/videoController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getVideos);
router.get("/meta", getVideoMeta);
router.post("/", adminOnly, addVideo);
router.delete("/:id", adminOnly, deleteVideo);

export default router;
