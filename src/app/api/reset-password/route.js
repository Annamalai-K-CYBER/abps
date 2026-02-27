import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "csbs_sync" });
}

const userSchema = new mongoose.Schema(
  {
    username: String,
    email: { type: String, unique: true },
    email1: String,
    password: String,
    role: { type: String, default: "user" },
    syncPoints: { type: Number, default: 0 },
    lastSync: Date,
    streak: { type: Number, default: 0 },
    contributionScore: { type: Number, default: 0 },
    resetOtp: String,
    resetOtpExpiry: Date,
  },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model("User", userSchema);

// POST /api/reset-password
// Body: { email, otp, newPassword }
export async function POST(req) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ success: false, message: "All fields are required." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, message: "Password must be at least 6 characters." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });

    if (!user || !user.resetOtp) {
      return NextResponse.json({ success: false, message: "Invalid request. Please request a new OTP." }, { status: 400 });
    }

    // Check OTP expiry
    if (new Date() > new Date(user.resetOtpExpiry)) {
      return NextResponse.json({ success: false, message: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    // Check OTP match
    if (user.resetOtp !== otp.trim()) {
      return NextResponse.json({ success: false, message: "Incorrect OTP. Please try again." }, { status: 400 });
    }

    // Hash new password and clear OTP fields
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: "Password reset successfully! You can now log in." });
  } catch (err) {
    console.error("reset-password error:", err);
    return NextResponse.json({ success: false, message: "Server error. Please try again." }, { status: 500 });
  }
}
