import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    // Sort by contributionScore (primary) and syncPoints (secondary)
    const topUsers = await User.find({}, "username syncPoints streak contributionScore")
      .sort({ contributionScore: -1, syncPoints: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      leaderboard: topUsers
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
