import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { mysqlDB } from "../config/db.js";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import emailService from "../Services/EmailService.js";

// User Registration
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await mysqlDB.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );
  
    await emailService.sendRegistrationEmail(email, name);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    // Check if error is due to duplicate entry (MySQL error code 1062)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

// Google Login Handler
export const googleLogin = async (req, res) => {
  const { googleToken } = req.body;

  try {
    // Validate input
    if (!googleToken) {
      return res.status(400).json({ error: "Google token is required" });
    }

    // Verify Google token
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${googleToken}` },
    });

    if (!response.ok) {
      return res.status(400).json({ error: "Invalid Google token" });
    }

    const userData = await response.json();
    const { email, name, sub: googleId } = userData;

    // Validate required user data
    if (!email || !name || !googleId) {
      return res.status(400).json({ error: "Incomplete user data from Google" });
    }

    // Get a connection from the pool
    const connection = await mysqlDB.getConnection();

    try {
      // Start transaction
      await connection.beginTransaction();

      // Check if user exists
      const [rows] = await connection.query(
        "SELECT id, name, email, google_id FROM users WHERE email = ?",
        [email]
      );

      let user;
      if (rows.length === 0) {
        // Insert new user
        const [result] = await connection.query(
          "INSERT INTO users (name, email, google_id, auth_provider) VALUES (?, ?, ?, 'google')",
          [name, email, googleId]
        );

        // Get the newly created user
        const [newUser] = await connection.query(
          "SELECT id, name, email FROM users WHERE id = ?",
          [result.insertId]
        );
        user = newUser[0];
      } else {
        user = rows[0];

        // Update google_id if not set
        if (!user.google_id) {
          await connection.query(
            "UPDATE users SET google_id = ?, auth_provider = 'google' WHERE id = ?",
            [googleId, user.id]
          );
        }
      }

      // Commit the transaction
      await connection.commit();

      // Generate JWT
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      // Send login email (optional)
      await emailService.sendLoginEmail(email, user.name);

      // Release the connection back to the pool
      connection.release();

      return res.json({
        message: "Google login successful",
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });

    } catch (dbError) {
      await connection.rollback();
      connection.release();
      throw dbError;
    }

  } catch (err) {
    console.error("Google Login Error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
};

// User Login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await mysqlDB.query(
      "SELECT id, name, email, password FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Password Not Correct" });
    }

    const token = jwt.sign({ id: user.id.toString() }, process.env.JWT_SECRET, { expiresIn: "1h" });
    await emailService.sendLoginEmail(email, user.name);
    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await mysqlDB.query(
      "SELECT id, email FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await mysqlDB.query(
      "INSERT INTO reset_tokens (user_id, token, type, expires_at) VALUES (?, ?, 'otp', ?)",
      [users[0].id, otp, expiresAt]
    );

    await emailService.sendOTPEmail(email, otp);
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await mysqlDB.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = users[0].id;
    const [activeTokens] = await mysqlDB.query(
      "SELECT COUNT(*) as count FROM reset_tokens WHERE user_id = ? AND type = 'otp' AND used = 0 AND expires_at > NOW()",
      [userId]
    );

    if (activeTokens[0].count === 0) {
      return res.status(400).json({
        error: "No active password reset request found.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await mysqlDB.query(
      "UPDATE reset_tokens SET used = 1 WHERE user_id = ? AND type = 'otp'",
      [userId]
    );

    await mysqlDB.query(
      "INSERT INTO reset_tokens (user_id, token, type, expires_at) VALUES (?, ?, 'otp', ?)",
      [userId, otp, expiresAt]
    );

    await emailService.sendOTPEmail(email, otp);
    res.status(200).json({ message: "New OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [users] = await mysqlDB.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = users[0].id;
    const [tokens] = await mysqlDB.query(
      "SELECT token, expires_at FROM reset_tokens WHERE user_id = ? AND token = ? AND type = 'otp' AND used = 0",
      [userId, otp]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const token = tokens[0];
    if (new Date() > new Date(token.expires_at)) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    // Mark OTP as used
    await mysqlDB.query(
      "UPDATE reset_tokens SET used = 1 WHERE user_id = ? AND token = ?",
      [userId, otp]
    );

    // Generate reset token
    const resetToken = uuidv4();
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await mysqlDB.query(
      "INSERT INTO reset_tokens (user_id, token, type, expires_at) VALUES (?, ?, 'reset', ?)",
      [userId, resetToken, resetExpiresAt]
    );

    res.status(200).json({
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { email, password, resetToken } = req.body;
  try {
    const [users] = await mysqlDB.query(
      "SELECT id, name FROM users WHERE email = ?", // Added name to the query
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = users[0].id;
    const userName = users[0].name; // Get user's name
    const [tokens] = await mysqlDB.query(
      "SELECT token, expires_at FROM reset_tokens WHERE user_id = ? AND token = ? AND type = 'reset' AND used = 0",
      [userId, resetToken]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const token = tokens[0];
    if (new Date() > new Date(token.expires_at)) {
      return res.status(400).json({ error: "Reset token has expired" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await mysqlDB.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    // Mark reset token as used
    await mysqlDB.query(
      "UPDATE reset_tokens SET used = 1 WHERE user_id = ? AND token = ?",
      [userId, resetToken]
    );

    // Send password change confirmation email
    await emailService.sendPasswordChangeEmail(email, userName);

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
