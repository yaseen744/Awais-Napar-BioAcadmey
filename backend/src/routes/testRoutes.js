import express from "express";
import {
  listTests,
  getTest,
  createTest,
  updateTest,
  deleteTest,
  setPublish,
  openTest,
  closeTest,
  startTest,
} from "../controllers/testController.js";
import { extractPdf } from "../controllers/pdfImportController.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { uploadPdf, handleUploadError } from "../middleware/upload.js";

const router = express.Router();

router.use(protect); // nobody gets past this without a valid login

// PDF question-bank import (preview only, nothing saved here)
router.post(
  "/import-pdf",
  adminOnly,
  uploadPdf.single("pdf"),
  handleUploadError,
  extractPdf
);

router.get("/", listTests);
router.get("/:id", getTest);
router.post("/", adminOnly, createTest);
router.patch("/:id", adminOnly, updateTest);
router.delete("/:id", adminOnly, deleteTest);

router.patch("/:id/publish", adminOnly, setPublish);
router.patch("/:id/open", adminOnly, openTest);
router.patch("/:id/close", adminOnly, closeTest);

router.post("/:id/start", startTest);

export default router;
