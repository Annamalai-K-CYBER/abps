import mongoose from "mongoose";
import { NextResponse } from "next/server";
import fetch from "node-fetch";

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

// POST /api/forgot-password  →  { email }
export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ success: false, message: "No account found with this email." }, { status: 404 });
    }
    if (!user.email1) {
      return NextResponse.json({
        success: false,
        message: "No secondary email on file. Please contact your admin to add one.",
      }, { status: 400 });
    }

    // 6-digit OTP, 10-minute expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const maskedEmail = user.email1.replace(/(.{2})(.+)(@.+)/, (_, a, b, c) => a + "*".repeat(b.length) + c);

    if (!process.env.BREVO_API_KEY) {
      return NextResponse.json({ success: false, message: "Email service not configured." }, { status: 500 });
    }

    const emailBody = {
      sender: { name: "CSBS SYNC", email: "csbssync@gmail.com" },
      to: [{ email: user.email1, name: user.username }],
      subject: "🔐 Your CSBS SYNC Password Reset OTP",
      htmlContent: `
        <div style="width:100%; background:#f3f4f6; padding:24px; font-family:system-ui,Arial,sans-serif;">
          <table align="center" width="100%" cellpadding="0" cellspacing="0"
            style="max-width:560px; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #e5e7eb;">

            <tr>
              <td style="background:linear-gradient(135deg,#1e3a8a,#4f46e5); padding:28px; text-align:center;">
                <img src="https://ik.imagekit.io/9t9wl5ryo/123.jpg" alt="CSBS SYNC" width="120"
                  style="display:block; margin:auto; border-radius:12px;" />
                <p style="color:rgba(255,255,255,0.8); margin:12px 0 0; font-size:13px; letter-spacing:2px; text-transform:uppercase;">
                  Password Reset
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:32px 28px;">
                <p style="font-size:16px; color:#374151; margin:0 0 8px;">
                  Hi <strong>${user.username}</strong>,
                </p>
                <p style="font-size:15px; color:#6b7280; line-height:1.6; margin:0 0 24px;">
                  We received a password reset request for your CSBS SYNC account.
                  Use the OTP below to reset your password. It's valid for <strong>10 minutes</strong>.
                </p>

                <div style="background:#eef2ff; border:2px solid #c7d2fe; border-radius:16px; padding:24px; text-align:center; margin-bottom:24px;">
                  <p style="color:#4f46e5; font-size:11px; font-weight:700; letter-spacing:4px;
                    text-transform:uppercase; margin:0 0 12px;">Your One-Time Password</p>
                  <p style="font-size:52px; font-weight:900; letter-spacing:14px; color:#1e1b4b;
                    margin:0; font-family:monospace;">${otp}</p>
                  <p style="color:#9ca3af; font-size:12px; margin:12px 0 0;">⏱ Expires in 10 minutes</p>
                </div>

                <p style="font-size:13px; color:#9ca3af; border-top:1px solid #f3f4f6;
                  padding-top:16px; margin:0; text-align:center;">
                  If you didn't request this, you can safely ignore this email.
                  Your password will not change.
                </p>
              </td>
            </tr>

            <tr>
              <td style="background:#f8fafc; padding:16px; text-align:center; font-size:11px; color:#9ca3af; border-top:1px solid #e5e7eb;">
                © 2025 CSBS SYNC · This is an automated security message, do not reply.
              </td>
            </tr>
          </table>
        </div>
      `,
    };

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(emailBody),
    });

    if (!brevoRes.ok) {
      const err = await brevoRes.json();
      console.error("Brevo error:", err);
      return NextResponse.json({ success: false, message: "Failed to send OTP email. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${maskedEmail}`,
    });
  } catch (err) {
    console.error("forgot-password error:", err);
    return NextResponse.json({ success: false, message: "Server error. Please try again." }, { status: 500 });
  }
}
