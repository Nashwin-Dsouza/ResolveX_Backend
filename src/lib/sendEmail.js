// lib/sendEmail.js
import sgMail from '@sendgrid/mail';

// This line sets the API key from your Render environment
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendComplaintEmail = async (to, subject, htmlBody) => {
  const msg = {
    to: to, // The department's email
    from: 'onlinecomplainmanager@gmail.com', // MUST be the email you verified on SendGrid
    subject: subject,
    html: htmlBody,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent successfully via SendGrid');
  } catch (error) {
    // If SendGrid fails, we just log it and don't crash the app
    console.error('Error sending email via SendGrid:', error);
    if (error.response) {
      console.error(error.response.body)
    }
  }
};