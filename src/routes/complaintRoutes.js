import express from "express";
import cloudinary from "../lib/cloudinary.js";
// import Book from "../models/Book.js"; // We don't need 'Book' in this file anymore
import protectRoute from "../middleware/auth.middleware.js";
import Complaint from "../models/complaintModel.js";

const router = express.Router();

// -----------------------------------------------------------------
// CREATE A NEW COMPLAINT
// (This route was already correct, no changes needed)
// -----------------------------------------------------------------
router.post("/", protectRoute, async (req, res) => {
  try {
    const { description, cause, impact, location, proofImage } = req.body;

    if (!description || !cause || !impact) {
      return res.status(400).json({
        message: "Please provide description, cause, and impact fields",
      });
    }

    let imageUrl = null;
    if (proofImage) {
      const uploadResponse = await cloudinary.uploader.upload(proofImage);
      imageUrl = uploadResponse.secure_url;
    }

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
router.get("/user", protectRoute, async (req, res) => {
  try {
    // Find complaints by user ID
    const complaints = await Complaint.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(complaints); // Renamed 'books' to 'complaints'
  } catch (error) {
    console.error("Get user complaints error:", error.message); // Updated log
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
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

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