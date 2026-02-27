import { connectDB } from "@/lib/db";
import Poll from "@/models/Poll";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    await connectDB();
    // Support both boolean and legacy string "true"
    const activePolls = await Poll.find({ 
      $or: [{ isActive: true }, { isActive: "true" }] 
    }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, polls: activePolls });
  } catch (err) {
    console.error("Poll GET err:", err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ success: false }, { status: 401 });
    
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret");
    
    // Any authenticated user can create polls (admins can manage via DB)

    const { question, options } = await req.json();
    await connectDB();
    const poll = await Poll.create({
      question,
      options: options.map(opt => ({ text: opt, votes: 0 })),
      createdBy: decoded.username
    });

    return NextResponse.json({ success: true, poll });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ success: false }, { status: 401 });
    
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecret");
    
    const { pollId, optionId } = await req.json();
    await connectDB();
    
    const poll = await Poll.findById(pollId);
    const voterId = decoded.userId || decoded.id || decoded.email;
    if (!poll || poll.votedBy.includes(voterId)) {
      return NextResponse.json({ success: false, message: "Already voted or poll not found" }, { status: 400 });
    }

    const option = poll.options.id(optionId);
    if (option) {
      option.votes += 1;
      poll.votedBy.push(voterId);
      await poll.save();
    }

    return NextResponse.json({ success: true, poll });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
