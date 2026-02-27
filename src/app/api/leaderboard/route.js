import mongoose from "mongoose";
import { NextResponse } from "next/server";

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "csbs_sync" });
}

const userSchema = new mongoose.Schema(
  {
    username: String,
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

export async function GET() {
  try {
    await connectDB();
    const topUsers = await User.find(
      {},
      "username syncPoints streak contributionScore"
    )
      .sort({ contributionScore: -1, syncPoints: -1 })
      .limit(10);

    return NextResponse.json({ success: true, leaderboard: topUsers });
  } catch (err) {
    console.error("leaderboard GET error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
