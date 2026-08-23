import express from "express";
import { submitAttempt, getMyAttempts, getAttemptDetail } from "../controllers/attemptController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", submitAttempt);
router.get("/me", getMyAttempts);
router.get("/:id", getAttemptDetail);

export default router;
