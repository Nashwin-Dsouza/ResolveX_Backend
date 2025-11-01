import express from "express";
import cloudinary from "../lib/cloudinary.js";
import Book from "../models/Book.js";
import protectRoute from "../middleware/auth.middleware.js";
import Complaint from "../models/complaintModel.js";

const router = express.Router();

// This route should be at the endpoint your app is calling, e.g., /api/v1/complaints
router.post("/", protectRoute, async (req, res) => {
  try {
    // 1. Destructure the NEW fields from your React Native app
    const { description, cause, impact, location, proofImage } = req.body;

    // 2. Validate the NEW required fields
    if (!description || !cause || !impact) {
      return res.status(400).json({ 
        message: "Please provide description, cause, and impact fields" 
      });
    }

    let imageUrl = null; // Default to null, since the image is optional

    // 3. Check if an image was provided before uploading
    if (proofImage) {
      // This logic is the same! It uploads the Base64 string
      const uploadResponse = await cloudinary.uploader.upload(proofImage);
      imageUrl = uploadResponse.secure_url;
    }

    // 4. Save to the NEW Complaint model
    // (Make sure you import your 'Complaint' model at the top)
    const newComplaint = new Complaint({
      description,
      cause,
      impact,
      location,
      proofImage: imageUrl, // Save the URL from Cloudinary (or null)
      user: req.user._id,   // This line is still correct!
    });

    await newComplaint.save();

    res.status(201).json(newComplaint);
  } catch (error) {
    // 5. Update the error message
    console.log("Error creating complaint", error);
    res.status(500).json({ message: error.message });
  }
});

// pagination => infinite loading
router.get("/", protectRoute, async (req, res) => {
  // example call from react native - frontend
  // const response = await fetch("http://localhost:3000/api/books?page=1&limit=5");
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 2;
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .sort({ createdAt: -1 }) // desc
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");

    const totalBooks = await Book.countDocuments();

    res.send({
      books,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log("Error in get all books route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// get recommended books by the logged in user
router.get("/user", protectRoute, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(books);
  } catch (error) {
    console.error("Get user books error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // check if user is the creator of the book
    if (book.user.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Unauthorized" });

    // https://res.cloudinary.com/de1rm4uto/image/upload/v1741568358/qyup61vejflxxw8igvi0.png
    // delete image from cloduinary as well
    if (book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.log("Error deleting image from cloudinary", deleteError);
      }
    }

    await book.deleteOne();

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.log("Error deleting book", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
