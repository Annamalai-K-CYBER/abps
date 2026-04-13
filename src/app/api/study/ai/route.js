import { NextResponse } from "next/server";

export const runtime = "nodejs";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL || "http://localhost:3000";
const OPENROUTER_SITE_NAME = process.env.OPENROUTER_SITE_NAME || "CSBS";

function buildPrompt({ subject, topic }) {
  return [
    "You are a study tutor for college students.",
    "Create a concise, accurate study aid for the given subject and topic.",
    "Return only valid JSON that matches the required keys.",
    "Also generate a simple SVG illustration that visually represents the topic.",
    "The SVG must be self-contained, safe, and suitable for display inside an img tag.",
    "Use a clean dark-theme palette with geometric shapes and a readable title.",
    "Keep the explanation practical and easy to understand.",
    `Subject: ${subject}`,
    `Topic: ${topic}`,
  ].join("\n");
}

export async function POST(req) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { success: false, message: "OPENROUTER_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const subject = String(body?.subject || "").trim();
    const topic = String(body?.topic || "").trim();

    if (!subject || !topic) {
      return NextResponse.json(
        { success: false, message: "Subject and topic are required" },
        { status: 400 }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": OPENROUTER_SITE_URL,
        "X-OpenRouter-Title": OPENROUTER_SITE_NAME,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You create compact study guides. Never include markdown fences. Output only JSON with the keys title, summary, key_points, mnemonic, quick_check, and svg.",
          },
          {
            role: "user",
            content: buildPrompt({ subject, topic }),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          message: "OpenRouter request failed",
          error: errorText,
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json(
        { success: false, message: "Empty response from OpenRouter" },
        { status: 502 }
      );
    }

    let aiData;
    try {
      aiData = typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to parse OpenRouter response",
          error: parseError.message,
          rawContent,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      model: data?.model || OPENROUTER_MODEL,
      study: aiData,
    });
  } catch (error) {
    console.error("❌ POST /api/study/ai Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate study aid", error: error.message },
      { status: 500 }
    );
  }
}