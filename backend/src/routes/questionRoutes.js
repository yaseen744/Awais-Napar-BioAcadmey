import express from "express";
import { getQuestions, getMeta, getAllQuestions, addQuestion } from "../controllers/questionController.js";
import { importQuestions } from "../controllers/pdfImportController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.use(protect); // nobody gets past this without a valid login

router.get("/", adminOnly, getQuestions);
router.get("/meta", adminOnly, getMeta);
router.get("/all", adminOnly, getAllQuestions);
router.post("/", adminOnly, addQuestion);
router.post("/import", adminOnly, importQuestions);

export default router;
