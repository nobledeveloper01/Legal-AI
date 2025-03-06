// emailService.js
import nodemailer from "nodemailer";

// Email Templates with HTML and CSS
const emailTemplates = {
  baseStyle: `
    <style>
      * { font-family: Arial, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
      .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
      .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
      .button { 
        background: #007bff; 
        color: white; 
        padding: 10px 20px; 
        text-decoration: none; 
        border-radius: 5px; 
        display: inline-block; 
      }
    </style>
  `,

  getRegistrationTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>${this.baseStyle}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome aboard!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Welcome to our platform! Your account has been successfully created.</p>
            <p>We're excited to have you with us. Get started by logging in to your account.</p>
            <a href="${process.env.APP_URL}/login" class="button">Login Now</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  getLoginTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>${this.baseStyle}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Login Notification</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>You have successfully logged in to your account at ${new Date().toLocaleString()}.</p>
            <p>If this wasn't you, please secure your account immediately.</p>
            <a href="${process.env.APP_URL}/forgot-password" class="button">Secure Account</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  getOTPTemplate(otp) {
    return `
      <!DOCTYPE html>
      <html>
      <head>${this.baseStyle}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Your OTP Code</h2>
            <p style="font-size: 24px; font-weight: bold; text-align: center; color: #007bff;">
              ${otp}
            </p>
            <p>This OTP expires in 10 minutes. Use it to reset your password.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  // Add this inside emailTemplates object
getPasswordChangeTemplate(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>${this.baseStyle}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your password was successfully changed on ${new Date().toLocaleString()}.</p>
            <p>If you did not make this change, please secure your account immediately by resetting your password.</p>
            <a href="${process.env.APP_URL}/forgot-password" class="button">Reset Password</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },
};

// Email Service
const emailService = {
  transporter: nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  }),

  async sendEmail(to, subject, html, text) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
      text,
    };
    return this.transporter.sendMail(mailOptions);
  },

  async sendRegistrationEmail(email, name) {
    const html = emailTemplates.getRegistrationTemplate(name);
    await this.sendEmail(
      email,
      "Welcome to Our Service!",
      html,
      `Hello ${name},\n\nWelcome to our platform! Your account has been successfully created.`
    );
  },

  async sendLoginEmail(email, name) {
    const html = emailTemplates.getLoginTemplate(name);
    await this.sendEmail(
      email,
      "Successful Login",
      html,
      `Hello ${name},\n\nYou have successfully logged in at ${new Date().toLocaleString()}.`
    );
  },

  async sendOTPEmail(email, otp) {
    const html = emailTemplates.getOTPTemplate(otp);
    await this.sendEmail(
      email,
      "Password Reset OTP",
      html,
      `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`
    );
  },
  async sendPasswordChangeEmail(email, name) {
    const html = emailTemplates.getPasswordChangeTemplate(name);
    await this.sendEmail(
      email,
      "Password Change Confirmation",
      html,
      `Hello ${name},\n\nYour password was successfully changed on ${new Date().toLocaleString()}.`
    );
  },
};

export default emailService;