import express from "express";
import { uploadFile, analyzeDocument, getUserDocuments } from "../controllers/documentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", verifyToken, uploadFile, analyzeDocument);
router.get("/history", verifyToken, getUserDocuments);

export default router;
