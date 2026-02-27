import { NextResponse } from "next/server";
import mongoose from "mongoose";
import ImageKit from "imagekit";

export const runtime = "nodejs";

// ── DB ──
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "csbs_sync" });
}

// ── Schemas ──
const materialSchema = new mongoose.Schema(
  { matname: String, subject: String, name: String, link: String, uploadDate: Date, format: String },
  { collection: "materials" }
);
const Material = mongoose.models.Material || mongoose.model("Material", materialSchema);

const userSchema = new mongoose.Schema(
  {
    username: String,
    name: String,
    email: { type: String, unique: true },
    email1: String,
    password: String,
    role: { type: String, default: "user" },
    syncPoints: { type: Number, default: 0 },
    contributionScore: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastSync: Date,
  },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model("User", userSchema);

// ── ImageKit ──
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// ── POST /api/upload — open to ALL authenticated users ──
export async function POST(req) {
  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get("file");
    const username = formData.get("username");
    const matname = formData.get("materialName");
    const subject = formData.get("subject");
    const uploadDate = formData.get("uploadDate");

    if (!file || !matname || !subject) {
      return NextResponse.json({ success: false, message: "Missing required fields!" }, { status: 400 });
    }

    // Upload to ImageKit
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadRes = await imagekit.upload({
      file: buffer.toString("base64"),
      fileName: file.name,
      folder: "/materials",
    });

    // Save material
    const newMaterial = await Material.create({
      matname,
      subject,
      name: username,
      link: uploadRes.url,
      uploadDate,
      format: file.name.split(".").pop(),
    });

    // ── Award points: +50 contribution + +20 sync points (material upload only) ──
    if (username) {
      try {
        await User.findOneAndUpdate(
          { username },
          { $inc: { contributionScore: 50, syncPoints: 20 } }
        );
      } catch (e) {
        console.error("Points award failed:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Uploaded! +50 Contribution Points & +20 Sync Points awarded. ✨",
      url: uploadRes.url,
      data: newMaterial,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ success: false, message: "Server error", error: err.message }, { status: 500 });
  }
}
