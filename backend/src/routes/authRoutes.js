import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  getPendingUsers,
  approveUser,
  rejectUser,
} from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);

// Admin-only: manage pending student approvals
router.get("/pending", protect, adminOnly, getPendingUsers);
router.post("/approve/:id", protect, adminOnly, approveUser);
router.delete("/reject/:id", protect, adminOnly, rejectUser);

export default router;
