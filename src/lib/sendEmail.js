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
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: subject,
    html: htmlBody,
  };

  // Let this throw an error if it fails
  await transporter.sendMail(mailOptions);
  console.log("Email sent successfully");
};
