import express from "express";
import cors from "cors";
import "dotenv/config";
import job from "./lib/cron.js";

import authRoutes from "./routes/authRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import userRoutes from './routes/userRoutes.js';

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3000;

job.start();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/v1/complaints", complaintRoutes);
app.use("/api/v1/users", userRoutes);
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
