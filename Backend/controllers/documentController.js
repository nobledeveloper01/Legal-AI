import multer from "multer";
import Document from "../models/document.js";
import openai from "../config/openai.js";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import textract from "textract";
import { userAccessMap } from "../middleware/authMiddleware.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadFile = upload.single("file");

export const analyzeDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Please upload a valid document." });
    }

    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.isAnonymous ? null : req.user.id;
    const isAnonymous = req.user.isAnonymous;
    const identifier = isAnonymous ? req.ip : userId;

    // Check upload limit before processing
    const userData = userAccessMap.get(identifier) || { count: 0, timestamp: Date.now() };
    const maxUploads = isAnonymous ? 3 : 10;
    
    if (userData.count >= maxUploads) {
      return res.status(429).json({
        error: `Upload limit reached (${maxUploads} per day). Please wait until tomorrow or delete existing documents.`,
        waitTime: 24,
      });
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    if (!allowedTypes.includes(mimetype)) {
      return res.status(400).json({ error: "Invalid file type. Upload a PDF, DOCX, DOC, or TXT file." });
    }

    // Extract text from file (unchanged)
    let extractedText = "";
    if (mimetype === "application/pdf") {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const wordData = await mammoth.extractRawText({ buffer });
      extractedText = wordData.value;
    } else if (mimetype === "application/msword") {
      extractedText = await new Promise((resolve, reject) => {
        textract.fromBufferWithMime(mimetype, buffer, (error, text) => {
          if (error) reject(error);
          resolve(text);
        });
      });
    } else {
      extractedText = buffer.toString("utf-8");
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: "Unable to extract text from the document." });
    }

    const truncatedText = extractedText.slice(0, 3200);

    // Analyze with OpenAI (unchanged)
    const analysisResult = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a legal document analysis AI. Analyze the provided legal document and return your analysis in the following JSON format: { risks: string[], summary: string, keyPoints: string[] }. Highlight potential risks, provide a concise summary, and extract key points such as payment terms, duration, jurisdiction, and renewal options if present. If the document is truncated or incomplete, do your best with the available text.",
        },
        { role: "user", content: truncatedText },
      ],
      max_tokens: 500,
    });

    const newDocument = new Document({
      filename: originalname,
      contentType: mimetype,
      fileId: buffer.toString("base64"),
      analysis: analysisResult.choices[0].message.content,
      userId,
      isAnonymous,
    });
    await newDocument.save();

    // Increment count in userAccessMap after successful upload
    userData.count += 1;
    userData.timestamp = Date.now();
    userAccessMap.set(identifier, userData);

    const remainingUploads = maxUploads - userData.count;

    res.status(201).json({
      message: "File uploaded and analyzed successfully!",
      analysis: analysisResult.choices[0].message.content,
      remainingUploads,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.isAnonymous) {
      return res.status(401).json({
        error: "Anonymous users cannot view document history. Please log in.",
      });
    }

    // Fetch documents regardless of upload limit
    const documents = await Document.find({ userId }).sort({ createdAt: -1 });
    
    // Calculate remaining uploads for frontend display
    const identifier = userId;
    const userData = userAccessMap.get(identifier) || { count: 0, timestamp: Date.now() };
    const maxUploads = 10;
    const remainingUploads = maxUploads - userData.count;

    res.status(200).json({
      documents,
      remainingUploads,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentId } = req.params;

    if (req.user.isAnonymous) {
      return res.status(401).json({
        error: "Anonymous users cannot delete documents. Please log in.",
      });
    }

    const document = await Document.findOne({ _id: documentId, userId });
    if (!document) {
      return res.status(404).json({
        error: "Document not found or you do not have permission to delete it.",
      });
    }

    await Document.deleteOne({ _id: documentId });

    const identifier = userId;
    const userData = userAccessMap.get(identifier) || { count: 0, timestamp: Date.now() };
    userData.count = Math.max(0, userData.count - 1);
    userData.timestamp = Date.now();
    userAccessMap.set(identifier, userData);

    const maxUploads = 10;
    const remainingUploads = maxUploads - userData.count;

    res.status(200).json({
      message: "Document deleted successfully!",
      remainingUploads,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};