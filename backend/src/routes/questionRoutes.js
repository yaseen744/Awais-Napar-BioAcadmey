import express from "express";
import { getQuestions, getMeta, addQuestion } from "../controllers/questionController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.use(protect); // nobody gets past this without a valid login

router.get("/", getQuestions);
router.get("/meta", getMeta);
router.post("/", adminOnly, addQuestion);

export default router;
