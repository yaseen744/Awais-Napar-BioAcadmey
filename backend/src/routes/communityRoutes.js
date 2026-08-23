import express from "express";
import { getPosts, getPost, createPost, addComment } from "../controllers/communityController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getPosts);
router.get("/:id", getPost);
router.post("/", createPost);
router.post("/:id/comments", addComment);

export default router;
