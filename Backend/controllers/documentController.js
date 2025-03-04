import multer from "multer";
import Document from "../models/document.js";
import openai from "../config/openai.js";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import textract from "textract";

// Multer setup for file uploads (PDF, DOCX, DOC, TXT)
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadFile = upload.single("file");

export const analyzeDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Please upload a valid document." });
    }

    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user?.id; // ✅ Extract userId from request

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "text/plain"];
    
    if (!allowedTypes.includes(mimetype)) {
      return res.status(400).json({ error: "Invalid file type. Upload a PDF, DOCX, DOC, or TXT file." });
    }

    let extractedText = "";
    if (mimetype === "application/pdf") {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const wordData = await mammoth.extractRawText({ buffer: buffer });
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

    const analysisResult = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Analyze the following legal document and highlight risks." },
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
    });

    await newDocument.save();

    res.status(201).json({
      message: "File uploaded and analyzed successfully!",
      analysis: analysisResult.choices[0].message.content,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getUserDocuments = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    const documents = await Document.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ documents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


