import express from "express";
import cloudinary from "../lib/cloudinary.js";
// import Book from "../models/Book.js"; // We don't need 'Book' in this file anymore
import protectRoute from "../middleware/auth.middleware.js";
import Complaint from "../models/complaintModel.js";
import { sendComplaintEmail } from "../lib/sendEmail.js";
import mongoose from "mongoose";
import axios from "axios";

const router = express.Router();
const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL;
// -----------------------------------------------------------------
// CREATE A NEW COMPLAINT
// (This route was already correct, no changes needed)
// -----------------------------------------------------------------
router.post("/", protectRoute, async (req, res) => {
  try {

    console.log("Attempting to call NLP service at:", NLP_SERVICE_URL);
    
    const { description, cause, impact, location, proofImage } = req.body;
    const user = req.user;

    

    // 1. Validation (Image is required)
    if (!description || !cause || !impact || !proofImage) {
      return res.status(400).json({
        message: "All fields, including a proof image, are required.",
      });
    }
    const uploadResponse = await cloudinary.uploader.upload(proofImage);
    const imageUrl = uploadResponse.secure_url;

    // 2. --- CALL NLP MICROSERVICE ---
    let department_email, department_name, classified_intent;
    
    try {
      const nlpResponse = await axios.post(NLP_SERVICE_URL, {
        description: description, // Send the complaint for classification
      });
      
      // Get the new data back from the Python service
      department_email = nlpResponse.data.department_email;
      department_name = nlpResponse.data.department_name;
      classified_intent = nlpResponse.data.intent;

    } catch (nlpError) {
      console.error("NLP Service failed:", nlpError.message);
      // Fallback to a general department
      department_email = "grievance@gov.in";
      department_name = "General Administration & Grievance";
      classified_intent = "UNCLASSIFIED";
    }

    // 3. --- GENERATE EMAIL BODY (Now with Department Name) ---
    const complaintId = new mongoose.Types.ObjectId();
    const emailBody = `
      <p><strong>New Complaint Filed:</strong> #${complaintId.toString().slice(-6)}</p>
      <p><strong>Filed By:</strong> ${user.username} (${user.email})</p>
      <p><strong>Assigned Department:</strong> ${department_name}</p>
      <p><strong>Classified As:</strong> ${classified_intent}</p>
      <hr>
      <h3>Full User Report:</h3>
      <p><strong>Description:</strong> ${description}</p>
      <p><strong>Cause:</strong> ${cause}</p>
      <p><strong>Impact:</strong> ${impact}</p>
      <p><strong>Location:</strong> ${location || "Not provided"}</p>
      <hr>
      <p><strong>Proof of Issue:</strong></p>
      <img src="${imageUrl}" alt="Proof Image" style="max-width: 100%; height: auto;" />
    `;

    // 4. --- SAVE TO DATABASE (with new fields) ---
    const newComplaint = new Complaint({
      _id: complaintId,
      user: user._id,
      description,
      cause,
      impact,
      location,
      proofImage: imageUrl,
      emailBody: emailBody,
      classified_intent: classified_intent,   // <-- Save new data
      department_email: department_email,     // <-- Save new data
      department_name: department_name        // <-- Save new data
    });
    await newComplaint.save();

    // 5. --- SEND RESPONSE & EMAIL ---
    res.status(201).json(newComplaint); // Send response immediately

    try {
      sendComplaintEmail(
        department_email, // Use the email from the NLP service
        `New Complaint: #${complaintId.toString().slice(-6)}`,
        emailBody
      );
    } catch (emailError) {
      console.error("CRITICAL: Email failed to send:", emailError);
    }

  } catch (error) {
    console.log("Error creating complaint", error);
    res.status(500).json({ message: error.message });
  }
});

// -----------------------------------------------------------------
// GET ALL COMPLAINTS (with pagination)
// (This route is now updated to fetch Complaints)
// -----------------------------------------------------------------
router.get("/", protectRoute, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 2;
    const skip = (page - 1) * limit;

    // Find 'Complaint' model instead of 'Book'
    const complaints = await Complaint.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage"); // This correctly gets the user info

    // Count 'Complaint' documents
    const totalComplaints = await Complaint.countDocuments();

    // Send the response with complaint data
    res.send({
      complaints, // Renamed 'books' to 'complaints'
      currentPage: page,
      totalComplaints, // Renamed 'totalBooks'
      totalPages: Math.ceil(totalComplaints / limit),
    });
  } catch (error) {
    console.log("Error in get all complaints route", error); // Updated log message
    res.status(500).json({ message: "Internal server error" });
  }
});

// -----------------------------------------------------------------
// GET COMPLAINTS BY THE LOGGED-IN USER
// (This route is now updated)
// -----------------------------------------------------------------
// GET COMPLAINTS BY THE LOGGED-IN USER (WITH PAGINATION)
router.get("/user", protectRoute, async (req, res) => {
  try {
    // 1. Get page and limit from query
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * limit;

    // 2. Create the filter
    const userFilter = { user: req.user._id };

    // 3. Find with pagination
    const complaints = await Complaint.find(userFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");

    // 4. Count the total
    const totalComplaints = await Complaint.countDocuments(userFilter);

    // 5. Send the full response object
    res.send({
      complaints,
      currentPage: page,
      totalComplaints,
      totalPages: Math.ceil(totalComplaints / limit),
    });
  } catch (error) {
    console.error("Get user complaints error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Add this new route for testing your email ---

router.get("/test-email", protectRoute, async (req, res) => {
  try {
    // Get the user's email from their token
    const userEmail = req.user.email; 
    
    console.log(`Sending test email to: ${userEmail}`);

    await sendComplaintEmail(
      userEmail, // Send it to the logged-in user
      "ResolveX Email Test",
      "<h1>Hi!</h1><p>This is a test to confirm your email credentials are working.</p>"
    );

    // This response will only send if the email works
    res.status(200).json({ message: "Test email sent successfully!" });

  } catch (error) {
    // This will run if sendComplaintEmail throws an error
    console.error("Test email failed:", error);
    res.status(500).json({ message: "Test email failed", error: error.message });
  }
});

router.get("/:id", protectRoute, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("user", "username email profileImage"); // Get user details

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Optional: Check if the user is authorized to see it
    if (complaint.user._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.status(200).json(complaint);
  } catch (error) {
    console.error("Get single complaint error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------------------------------------------------
// DELETE A COMPLAINT
// (This route is now updated)
// -----------------------------------------------------------------
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    // Find 'Complaint' by ID
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint)
      return res.status(404).json({ message: "Complaint not found" });

    // Check if user is the creator of the complaint
    

    // Delete image from cloudinary as well
    // Updated to check 'proofImage' (your new field name)
    if (complaint.proofImage && complaint.proofImage.includes("cloudinary")) {
      try {
        const publicId = complaint.proofImage.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.log("Error deleting image from cloudinary", deleteError);
      }
    }

    // Delete the complaint
    await complaint.deleteOne();

    res.json({ message: "Complaint deleted successfully" });
  } catch (error) {
    console.log("Error deleting complaint", error); // Updated log
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
