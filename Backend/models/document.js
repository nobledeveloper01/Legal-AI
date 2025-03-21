import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  fileId: { type: String, required: true },
  analysis: { type: String, required: true },
  userId: {
    type: Number, // Change to Number if you intend to store numeric IDs
    required: function () {
      return !this.isAnonymous;
    },
  },
  isAnonymous: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Document = mongoose.model("Document", DocumentSchema);

export default Document;
