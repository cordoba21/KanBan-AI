import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

function getAdminSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Verify the caller is authenticated (defense-in-depth)
async function verifyAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

// Retry with exponential backoff + fallback model
async function generateWithRetry(prompt: string, maxRetries = 3) {
  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];

  for (let modelIdx = 0; modelIdx < models.length; modelIdx++) {
    const model = models[modelIdx];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        return response.text;
      } catch (error: any) {
        const status = error?.status || error?.code;
        const isRetryable = status === 503 || status === 429;

        if (isRetryable && attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
          continue;
        }

        if (isRetryable && modelIdx < models.length - 1) {
          console.warn(`Model ${model} unavailable, trying fallback...`);
          break;
        }

        if (!isRetryable) throw error;
      }
    }
  }
  throw new Error("All AI models are currently unavailable. Please try again later.");
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    // Auth check — even though middleware blocks, verify independently
    const isAuthed = await verifyAuth();
    if (!isAuthed) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Fetch current board state for context
    const adminSupabase = getAdminSupabase();
    const authedSupabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );
    const {
      data: { user },
    } = await authedSupabase.auth.getUser();

    const { data: profile } = await authedSupabase
      .from("profiles")
      .select("active_board_id")
      .eq("id", user?.id || "")
      .single();

    if (!profile?.active_board_id) {
      return NextResponse.json({ response: "No hay un tablero activo para analizar." });
    }

    const { data: tasks } = await adminSupabase
      .from("tasks")
      .select("id, title, status, priority, created_at, updated_at")
      .eq("board_id", profile.active_board_id)
      .order("updated_at", { ascending: false })
      .limit(50);

    // Build context-aware prompt
    const systemContext = `You are an AI assistant for a project management platform called "KanBan AI". You help users understand their project data, provide insights, and answer questions about their tasks and workflows.

## Current Board State:
${JSON.stringify(tasks || [], null, 2)}

## Summary:
- Total tasks: ${tasks?.length || 0}
- Backlog: ${tasks?.filter((t) => t.status === "BACKLOG").length || 0}
- To Do: ${tasks?.filter((t) => t.status === "TODO").length || 0}
- In Progress: ${tasks?.filter((t) => t.status === "IN_PROGRESS").length || 0}
- Review: ${tasks?.filter((t) => t.status === "REVIEW").length || 0}
- Done: ${tasks?.filter((t) => t.status === "DONE").length || 0}

Answer the user's question based on this data. Be helpful, concise, and specific. If asked about tasks, reference actual task titles and statuses. Use Markdown formatting for readability.`;

    // Build conversation with context
    const fullPrompt = `${systemContext}

${history?.length ? `## Previous Conversation:\n${history.map((h: any) => `${h.role}: ${h.content}`).join("\n")}\n` : ""}

## User Question:
${message}

## Your Response:`;

    const responseText = await generateWithRetry(fullPrompt);

    return NextResponse.json({
      response: responseText,
    });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}
