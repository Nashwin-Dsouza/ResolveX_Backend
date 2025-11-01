import mongoose from "mongoose";

const { Schema } = mongoose;

// This is the blueprint for your complaint data
const complaintSchema = new Schema(
  {
    // This links the complaint to the user who created it
    // 'ref: "User"' is the magic part that connects this to your User model
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // This comes from the 'complaint' state in your app
    description: {
      type: String,
      required: true,
    },
    // This comes from the 'cause' state
    cause: {
      type: String,
      required: true,
    },
    // This comes from the 'impact' state
    impact: {
      type: String,
      required: true,
    },
    // This comes from the 'location' state (it's optional)
    location: {
      type: String,
    },
    // This will be the URL from Cloudinary (it's optional)
    proofImage: {
      type: String,
    },
    // I added this field for you. It's very useful for tracking.
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"], // Only allows these values
      default: "Pending", // New complaints will automatically be 'Pending'
    },
  },
  {
    // This automatically adds 'createdAt' and 'updatedAt' fields
    timestamps: true,
  }
);

// This creates the model that your routes will use
const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;