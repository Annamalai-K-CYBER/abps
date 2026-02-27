import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    email1: String,
    password: { type: String, required: true },
    role: { type: String, default: "user" }, // admin | user
    syncPoints: { type: Number, default: 0 },
    lastSync: { type: Date },
    streak: { type: Number, default: 0 },
    contributionScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
