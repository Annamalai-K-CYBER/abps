import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret");
    
    await connectDB();
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const lastSync = user.lastSync ? new Date(user.lastSync) : null;
    
    // Check if sync already done today
    if (lastSync && lastSync.toDateString() === now.toDateString()) {
      return NextResponse.json({ 
        success: false, 
        message: "Already synced today! Come back tomorrow. ✨",
        points: user.syncPoints,
        streak: user.streak
      });
    }

    // Update streak
    let newStreak = 1;
    if (lastSync) {
      const diffTime = Math.abs(now - lastSync);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak = user.streak + 1;
      }
    }

    const pointsToAdd = 10 + (newStreak * 2); // 10 base + streak bonus
    user.syncPoints += pointsToAdd;
    user.streak = newStreak;
    user.lastSync = now;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `Checked in! You earned ${pointsToAdd} Sync Points. 🚀`,
      points: user.syncPoints,
      streak: user.streak
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret");
    
    await connectDB();
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      points: user.syncPoints,
      streak: user.streak
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
