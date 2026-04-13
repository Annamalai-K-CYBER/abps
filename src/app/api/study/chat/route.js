import { NextResponse } from "next/server";

export const runtime = "nodejs";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

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
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    if (messages.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one message is required" },
        { status: 400 }
      );
    }

    const trimmedMessages = messages
      .filter(message => message && typeof message.content === "string")
      .slice(-12)
      .map(message => ({
        role: message.role === "assistant" ? "assistant" : message.role === "system" ? "system" : "user",
        content: message.content.trim(),
      }));

    const contextLine = [
      subject ? `Subject: ${subject}` : "Subject: general study help",
      topic ? `Topic: ${topic}` : "Topic: general guidance",
    ].join("\n");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.55,
        messages: [
          {
            role: "system",
            content: [
              "You are a patient, concise study tutor for college students.",
              "Explain ideas clearly, use short examples when useful, and ask follow-up questions when needed.",
              "Keep answers focused on the selected subject and topic.",
              "Avoid markdown fences unless the user explicitly asks for code.",
              contextLine,
            ].join("\n"),
          },
          ...trimmedMessages,
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
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return NextResponse.json(
        { success: false, message: "Empty response from OpenRouter" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      model: data?.model || OPENROUTER_MODEL,
      reply,
    });
  } catch (error) {
    console.error("❌ POST /api/study/chat Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate chat reply", error: error.message },
      { status: 500 }
    );
  }
}