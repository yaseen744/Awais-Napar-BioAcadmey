import express from "express";
import { getNotes, getNoteMeta, addNote, deleteNote } from "../controllers/noteController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotes);
router.get("/meta", getNoteMeta);
router.post("/", adminOnly, addNote);
router.delete("/:id", adminOnly, deleteNote);

export default router;
