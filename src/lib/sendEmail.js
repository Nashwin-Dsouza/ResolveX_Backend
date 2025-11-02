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

export const sendComplaintEmail = async (to, subject, htmlBody) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: htmlBody, // We use HTML to format it nicely
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    // We don't throw an error, just log it. The complaint was still saved.
  }
};