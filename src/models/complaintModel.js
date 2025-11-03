import mongoose from "mongoose";

const { Schema } = mongoose;

// This is the blueprint for your complaint data
const complaintSchema = new Schema(
  {
    // This links the complaint to the user who created it
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
    // This will be the URL from Cloudinary (now required)
    proofImage: {
      type: String,
      required: true, // We made this required
    },
    // This is for tracking
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"], // Only allows these values
      default: "Pending", // New complaints will automatically be 'Pending'
    },
    // --- THIS IS YOUR NEW FIELD ---
    emailBody: {
      type: String,
      required: true,
    },
    emailBody: {
      type: String,
      required: true,
    },
    classified_intent: {
      type: String, // e.g., 'BUS_LATE_OR_NO_SHOW'
    },
    department_assigned: {
      type: String, // e.g., 'bus.services@transport.gov.in'
    }
  
  
  },
 
  {
    // This automatically adds 'createdAt' and 'updatedAt' fields
    timestamps: true,
  }
);

// This creates the model that your routes will use
const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;