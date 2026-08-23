import express from "express";
import { getLeaderboard, getMyRank } from "../controllers/leaderboardController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getLeaderboard);
router.get("/me", getMyRank);

export default router;
