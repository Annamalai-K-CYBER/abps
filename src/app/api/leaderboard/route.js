import mongoose from "mongoose";
import { NextResponse } from "next/server";

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "csbs_sync" });
}

const userSchema = new mongoose.Schema(
  {
    username: String,
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: "user" },
    syncPoints: { type: Number, default: 0 },
    lastSync: { type: Date },
    streak: { type: Number, default: 0 },
    contributionScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

// GET /api/leaderboard
// Sorted by: syncPoints desc (syncPoints = check-in pts + material upload pts)
// Returns: username, name, syncPoints, contributionScore (material uploads), streak
export async function GET() {
  try {
    await connectDB();
    const topUsers = await User.find(
      {},
      "username name syncPoints streak contributionScore"
    )
      .sort({ syncPoints: -1, contributionScore: -1, streak: -1 })
      .limit(20);

    return NextResponse.json({ success: true, leaderboard: topUsers });
  } catch (err) {
    console.error("leaderboard GET error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
