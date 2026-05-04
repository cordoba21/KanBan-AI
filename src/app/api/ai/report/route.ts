import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

// Use service role to read all tasks (bypasses RLS)
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
  const models = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"];

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

function stripEmojis(text: string) {
  return text.replace(/[\p{Extended_Pictographic}\u200d\uFE0F]/gu, "");
}

export async function POST(request: Request) {
  try {
    // Auth check — even though middleware blocks, verify independently
    const isAuthed = await verifyAuth();
    if (!isAuthed) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = getAdminSupabase();

    // Fetch all tasks
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (tasksError) throw tasksError;

    // Fetch recent activity logs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: logs, error: logsError } = await supabase
      .from("activity_logs")
      .select("*")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(200);

    if (logsError) throw logsError;

    // Build the prompt
    const prompt = `Eres un analista experto en gestión de proyectos. Analiza los siguientes datos y genera un reporte mensual completo en formato Markdown.

## Tareas Actuales (JSON):
\`\`\`json
${JSON.stringify(tasks, null, 2)}
\`\`\`

## Registros de Actividad (Últimos 30 Días):
\`\`\`json
${JSON.stringify(logs, null, 2)}
\`\`\`

## Requisitos del Reporte:
1. **Resumen Ejecutivo** — Visión general del estado del proyecto
2. **Desglose por Estado** — Conteo y porcentaje por estado (Backlog, To Do, In Progress, Review, Done)
3. **Análisis de Productividad** — Tareas creadas vs completadas, tendencias de velocidad
4. **Evaluación de Riesgos** — Tareas atascadas, cuellos de botella en Review, tareas vencidas
5. **Actividad del Equipo** — Contribuyentes más activos según registros
6. **Recomendaciones** — Acciones concretas para mejorar el flujo
7. **Métricas Clave** — Tasa de completitud, tiempo promedio por estado, throughput

Formato:
- Usa un título principal en H1 y secciones en H2.
- Usa H3 para subsecciones cuando aplique.
- Usa listas con viñetas para puntos clave.
- No uses emojis.
- Redacta en español neutro y con cifras específicas basadas en los datos.`;

    const reportText = await generateWithRetry(prompt);
    const cleanedReport = stripEmojis(reportText || "").trim();

    return NextResponse.json({
      report: cleanedReport,
      generatedAt: new Date().toISOString(),
      taskCount: tasks?.length || 0,
      logCount: logs?.length || 0,
    });
  } catch (error: any) {
    console.error("AI Report Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
