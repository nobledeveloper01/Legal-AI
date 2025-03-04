import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { mysqlDB, connectMongoDB } from './config/db.js';

// Import routes
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";

// Initialize dotenv for environment variables
dotenv.config();

// Initialize express app
const app = express();
app.use(cors());
app.use(express.json());

mysqlDB;
connectMongoDB(); 

// Routes for authentication and documents
app.use("/auth", authRoutes);
app.use("/documents", documentRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
