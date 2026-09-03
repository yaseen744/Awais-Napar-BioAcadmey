import express from "express";
import {
  submitAttempt,
  getMyAttempts,
  getAllAttempts,
  getAttemptDetail,
} from "../controllers/attemptController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", submitAttempt);
router.get("/me", getMyAttempts);
router.get("/", adminOnly, getAllAttempts);
router.get("/:id", getAttemptDetail);

export default router;
