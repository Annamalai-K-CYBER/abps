import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "csbs_sync" });
}

const optionSchema = new mongoose.Schema({
  text: String,
  votes: { type: Number, default: 0 },
});

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [optionSchema],
    createdBy: String,
    isActive: { type: Boolean, default: true },
    votedBy: [String],
  },
  { timestamps: true }
);

const Poll = mongoose.models.Poll || mongoose.model("Poll", pollSchema);

function decodeToken(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET || "supersecret");
  } catch {
    return null;
  }
}

// GET: Fetch all active polls
export async function GET() {
  try {
    await connectDB();
    const polls = await Poll.find({ isActive: true }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, polls });
  } catch (err) {
    console.error("polls GET error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// POST: Create a new poll (any authenticated user)
export async function POST(req) {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { question, options } = await req.json();
    if (!question || !options || options.length < 2) {
      return NextResponse.json({ success: false, message: "Need a question and at least 2 options" }, { status: 400 });
    }

    await connectDB();
    const poll = await Poll.create({
      question,
      options: options.map((opt) => ({ text: opt, votes: 0 })),
      createdBy: decoded.username || decoded.email,
    });

    return NextResponse.json({ success: true, poll });
  } catch (err) {
    console.error("polls POST error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// PUT: Vote on a poll
export async function PUT(req) {
  try {
    const decoded = decodeToken(req);
    if (!decoded) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { pollId, optionId } = await req.json();
    if (!pollId || !optionId) {
      return NextResponse.json({ success: false, message: "Missing pollId or optionId" }, { status: 400 });
    }

    await connectDB();
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return NextResponse.json({ success: false, message: "Poll not found" }, { status: 404 });
    }

    // Use userId as voter identifier (falls back to email)
    const voterId = String(decoded.userId || decoded.id || decoded.email);
    if (poll.votedBy.includes(voterId)) {
      return NextResponse.json({ success: false, message: "You have already voted on this poll." }, { status: 400 });
    }

    const option = poll.options.id(optionId);
    if (!option) {
      return NextResponse.json({ success: false, message: "Option not found" }, { status: 404 });
    }

    option.votes += 1;
    poll.votedBy.push(voterId);
    await poll.save();

    return NextResponse.json({ success: true, poll });
  } catch (err) {
    console.error("polls PUT error:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
