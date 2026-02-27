import { NextResponse } from "next/server";
import mongoose from "mongoose";
import ImageKit from "imagekit";

// ✅ Ensure this runtime runs on Node.js
export const runtime = "nodejs";

// ======================
// 🔹 MongoDB Connection
// ======================
const MONGODB_URI = process.env.MONGODB_URI;
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  if (!MONGODB_URI) throw new Error("⚠️ MONGODB_URI not found in env.");

  // ✅ Explicitly connect to the intended database
  await mongoose.connect(MONGODB_URI, { dbName: "csbs_sync" });
  isConnected = true;
  console.log("✅ MongoDB Connected → csbs_portal (upload route)");
}

// ======================
// 🔹 Mongoose Schema
// ======================
const materialSchema = new mongoose.Schema(
  {
    matname: String,
    subject: String,
    name: String,
    link: String,
    uploadDate: Date,
    format: String,
  },
  { collection: "materials" }
);

const Material =
  mongoose.models.Material || mongoose.model("Material", materialSchema);

// ======================
// 🔹 ImageKit Setup
// ======================
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// ======================
// 🔹 POST → Upload Material
// ======================
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
      return NextResponse.json(
        { success: false, message: "Missing required fields!" },
        { status: 400 }
      );
    }

    // ✅ Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64File = buffer.toString("base64");

    // ✅ Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: base64File,
      fileName: file.name,
      folder: "/materials",
    });

    // ✅ Save to MongoDB
    const newMaterial = await Material.create({
      matname,
      subject,
      name: username,
      link: uploadResponse.url,
      uploadDate,
      format: file.name.split(".").pop(),
    });

    // ✅ Award Contribution Points
    try {
       await connectDB();
       const User = (await import("@/models/User")).default;
       await User.findOneAndUpdate(
         { username: username }, 
         { $inc: { contributionScore: 50, syncPoints: 20 } }
       );
    } catch (dbErr) {
       console.error("Fail to award points:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully! +50 Contribution Points awarded. ✨",
      url: uploadResponse.url,
      data: newMaterial,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
