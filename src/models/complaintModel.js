import mongoose from "mongoose";

const { Schema } = mongoose;

// This is the blueprint for your complaint data
const complaintSchema = new Schema(
  {
    // --- Core User Info ---
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // --- User Input Fields ---
    description: {
      type: String,
      required: true,
    },
    cause: {
      type: String,
      required: true,
    },
    impact: {
      type: String,
      required: true,
    },
    location: {
      type: String,
    },
    proofImage: {
      type: String,
      required: true,
    },

    // --- Internal App Fields ---
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },
    emailBody: {
      type: String,
      required: true,
    },
    
    // --- NLP Classification Fields ---
    classified_intent: {
      type: String, // e.g., 'BUS_ISSUE'
    },
    department_email: {
      type: String, // e.g., 'bus.services@transport.gov.in'
    },
    department_name: {
      type: String, // e.g., 'Public Bus Service Department'
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