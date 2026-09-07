import express from "express";
import {
  getQuestions,
  getMeta,
  getAllQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/questionController.js";
import { importQuestions } from "../controllers/pdfImportController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.use(protect); // nobody gets past this without a valid login

router.get("/", getQuestions);
router.get("/meta", getMeta);
router.get("/all", adminOnly, getAllQuestions);
router.post("/", adminOnly, addQuestion);
router.post("/import", adminOnly, importQuestions);
router.patch("/:id", adminOnly, updateQuestion);
router.delete("/:id", adminOnly, deleteQuestion);

export default router;
