import express from "express";
import cloudinary from "../lib/cloudinary.js";
// import Book from "../models/Book.js"; // We don't need 'Book' in this file anymore
import protectRoute from "../middleware/auth.middleware.js";
import Complaint from "../models/complaintModel.js";
import { sendComplaintEmail } from "../lib/sendEmail.js";

const router = express.Router();

// -----------------------------------------------------------------
// CREATE A NEW COMPLAINT
// (This route was already correct, no changes needed)
// -----------------------------------------------------------------
router.post("/", protectRoute, async (req, res) => {
  try {
    const { description, cause, impact, location, proofImage } = req.body;

    if (!description || !cause || !impact || !proofImage) {
      return res.status(400).json({
        message: "All fields, including a proof image, are required.",
      });
    }

    // Now we can upload it, knowing it exists
    const uploadResponse = await cloudinary.uploader.upload(proofImage);
    const imageUrl = uploadResponse.secure_url;

    const newComplaint = new Complaint({
      description,
      cause,
      impact,
      location,
      proofImage: imageUrl,
      user: req.user._id,
    });

    await newComplaint.save();
    res.status(201).json(newComplaint);
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

router.post("/", protectRoute, async (req, res) => {
  try {
    const { description, cause, impact, location, proofImage } = req.body;
    const user = req.user; // Get the full user from protectRoute

    // 1. Validation (This is your code from Part 1)
    if (!description || !cause || !impact || !proofImage) {
      return res.status(400).json({
        message: "All fields, including a proof image, are required.",
      });
    }
    const uploadResponse = await cloudinary.uploader.upload(proofImage);
    const imageUrl = uploadResponse.secure_url;

    // 2. --- DETERMINE THE "PROPER DEPARTMENT" ---
    // This is business logic. For now, let's use a placeholder.
    // You could make this more complex later (e.g., based on 'cause')
    const departmentEmail = "nashwindsouza2801@gmail.com";
    const complaintId = new mongoose.Types.ObjectId(); // Generate ID now

    // 3. --- GENERATE THE "EMAIL BODY" ---
    // This is the formatted text we will save and send
    const emailBody = `
      <p><strong>New Complaint Filed:</strong> #${complaintId.toString().slice(-6)}</p>
      <p><strong>Filed By:</strong> ${user.username} (${user.email})</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <hr>
      <h3>Complaint Details:</h3>
      <p><strong>Description:</strong> ${description}</p>
      <p><strong>Cause:</strong> ${cause}</p>
      <p><strong>Impact:</strong> ${impact}</p>
      <p><strong>Location:</strong> ${location || "Not provided"}</p>
      <hr>
      <p><strong>Proof of Issue:</strong></p>
      <img src="${imageUrl}" alt="Proof Image" style="max-width: 500px;" />
    `;

    // 4. --- SAVE THE COMPLAINT (with the new field) ---
    const newComplaint = new Complaint({
      _id: complaintId, // Use the ID we generated
      description,
      cause,
      impact,
      location,
      proofImage: imageUrl,
      user: user._id,
      emailBody: emailBody, // <-- SAVE THE EMAIL BODY HERE
    });
    await newComplaint.save();

    // 5. --- SEND THE EMAIL (After saving) ---
    await sendComplaintEmail(
      departmentEmail,
      `New Complaint: #${complaintId.toString().slice(-6)}`,
      emailBody
    );

    res.status(201).json(newComplaint);
  } catch (error) {
    console.log("Error creating complaint", error);
    res.status(500).json({ message: error.message });
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
    if (complaint.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Unauthorized" });

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
