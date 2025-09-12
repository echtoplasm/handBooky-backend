/*
// services/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD  // Your 16-character app password
  }
});

const sendVerificationEmail = async (email, token, userId) => {
  try {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${userId}/${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - Student Handbook App',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Welcome to Student Handbook App!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email
          </a>
          <p>Or copy and paste this link: ${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = { sendVerificationEmail };
*/
