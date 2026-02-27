import mongoose from "mongoose";

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [
      {
        text: String,
        votes: { type: Number, default: 0 },
      },
    ],
    createdBy: String,
    isActive: { type: String, default: "true" },
    votedBy: [String], // Array of emails or userIds to prevent multiple votes
  },
  { timestamps: true }
);

export default mongoose.models.Poll || mongoose.model("Poll", pollSchema);
