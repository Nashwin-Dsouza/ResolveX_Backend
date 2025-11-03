// routes/userRoutes.js
import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import Complaint from '../models/complaintModel.js';
import User from '../models/userModel.js'; // Make sure to import your User model

const router = express.Router();

// GET /api/v1/users/stats
// Fetches stats for the logged-in user
router.get('/stats', protectRoute, async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get the user's join date
    const user = await User.findById(userId).select('createdAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Count the user's total complaints
    const totalIssues = await Complaint.countDocuments({ user: userId });

    res.status(200).json({
      memberSince: user.createdAt,
      totalIssues: totalIssues,
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;