import mysql from "mysql2/promise";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// ✅ MySQL Connection Pool (Better Performance)
export const mysqlDB = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  waitForConnections: true,
  connectionLimit: 10, 
  queueLimit: 0,
});

mysqlDB.getConnection()
  .then(() => console.log("✅ MySQL connected successfully"))
  .catch((err) => {
    console.error("❌ MySQL connection error:", err.message);
    process.exit(1);
  });


export const connectMongoDB = async () => {
    try {
      // Use the environment variable as defined in your .env file
      const mongoURI = process.env.MONGO_URI;
      const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
      const conn = await mongoose.connect(mongoURI, clientOptions);
      console.log("✅ MongoDB connected successfully");
    } catch (error) {
      console.error("❌ MongoDB connection error:", error.message);
      process.exit(1);
    }
  };
