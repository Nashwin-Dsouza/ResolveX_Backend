// lib/sendEmail.js
import nodemailer from "nodemailer";

// Set up the transporter one time
const transporter = nodemailer.createTransport({
  service: "gmail", // Or your email provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// lib/sendEmail.js
export const sendComplaintEmail = async (to, subject, htmlBody) => {
  try { // <-- ADD THIS
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: htmlBody,
    };
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) { // <-- ADD THIS
    console.error("Error sending email:", error);
  }
};
