import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

// ─── Inline DB connect (same pattern as login/route.js) ───
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "csbs_sync" });
}

// ─── Inline User Schema (must match fields in login schema + new fields) ───
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

// Prevent model overwrite during hot reload
const User = mongoose.models.User || mongoose.model("User", userSchema);

// ─── Helper: decode JWT ───
function decodeToken(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET || "supersecret");
  } catch {
    return null;
  }
}

// ─── GET: Fetch user's current sync stats ───
export async function GET(req) {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(decoded.userId).select("syncPoints streak");

    if (!user) {
      // User exists but fields might be missing — return defaults
      return NextResponse.json({ success: true, points: 0, streak: 0 });
    }

    return NextResponse.json({
      success: true,
      points: user.syncPoints ?? 0,
      streak: user.streak ?? 0,
    });
  } catch (err) {
    console.error("sync-points GET error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// ─── POST: Daily check-in / sync ───
export async function POST(req) {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(decoded.userId);

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const lastSync = user.lastSync ? new Date(user.lastSync) : null;

    // Already checked in today?
    if (lastSync && lastSync.toDateString() === now.toDateString()) {
      return NextResponse.json({
        success: false,
        message: "Already synced today! Come back tomorrow. ✨",
        points: user.syncPoints ?? 0,
        streak: user.streak ?? 0,
      });
    }

    // Calculate streak
    let newStreak = 1;
    if (lastSync) {
      const diffDays = Math.round((now - lastSync) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak = (user.streak ?? 0) + 1;
      }
      // More than 1 day gap → streak resets to 1
    }

    // Award points: 10 base + 2 per streak day (capped at 30 bonus)
    const streakBonus = Math.min(newStreak * 2, 30);
    const pointsToAdd = 10 + streakBonus;

    user.syncPoints = (user.syncPoints ?? 0) + pointsToAdd;
    user.streak = newStreak;
    user.lastSync = now;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `🎉 Checked in! +${pointsToAdd} Sync Points | ${newStreak} day streak 🔥`,
      points: user.syncPoints,
      streak: user.streak,
    });
  } catch (err) {
    console.error("sync-points POST error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
