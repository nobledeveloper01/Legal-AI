import express from "express";
import { uploadFile, analyzeDocument, getUserDocuments, deleteDocument } from "../controllers/documentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", verifyToken, uploadFile, analyzeDocument);
router.get("/history", verifyToken, getUserDocuments);
router.delete("/:documentId", verifyToken, deleteDocument);

export default router;