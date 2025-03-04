import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  fileId: String, 
  analysis: String,
  userId: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now },
});

const Document = mongoose.model("Document", DocumentSchema);

export default Document;
