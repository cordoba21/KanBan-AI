import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database, Profile } from "@/types/supabase";

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

async function getAuthedSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
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

function formatUserName(profile?: Profile | null) {
  return profile?.full_name || profile?.email || "Usuario";
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

    const adminSupabase = getAdminSupabase();
    const authedSupabase = await getAuthedSupabase();

    const {
      data: { user },
    } = await authedSupabase.auth.getUser();

    // Fetch all tasks for active board
    const { data: profile } = await authedSupabase
      .from("profiles")
      .select("active_board_id")
      .eq("id", user?.id || "")
      .single();

    if (!profile?.active_board_id) {
      return NextResponse.json({ error: "No active board" }, { status: 400 });
    }

    const { data: tasks, error: tasksError } = await adminSupabase
      .from("tasks")
      .select("*")
      .eq("board_id", profile.active_board_id)
      .order("created_at", { ascending: false });

    if (tasksError) throw tasksError;

    // Fetch recent activity logs (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: logs, error: logsError } = await adminSupabase
      .from("activity_logs")
      .select("*")
      .eq("board_id", profile.active_board_id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(200);

    if (logsError) throw logsError;

    const userIds = new Set<string>();
    (tasks || []).forEach((task) => {
      if (task.user_id) userIds.add(task.user_id);
      if (task.assigned_to) userIds.add(task.assigned_to);
    });
    (logs || []).forEach((log) => {
      if (log.user_id) userIds.add(log.user_id);
    });

    let profilesById = new Map<string, Profile>();
    if (userIds.size > 0) {
      const { data: profiles, error: profilesError } = await adminSupabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", Array.from(userIds));
      if (profilesError) throw profilesError;
      profilesById = new Map((profiles || []).map((profile) => [profile.id, profile as Profile]));
    }

    const sanitizedTasks = (tasks || []).map((task) => {
      const { id, user_id, assigned_to, ...rest } = task;
      return {
        ...rest,
        user_id: formatUserName(profilesById.get(user_id)),
        assigned_to: assigned_to ? formatUserName(profilesById.get(assigned_to)) : null,
      };
    });

    const sanitizedLogs = (logs || []).map((log) => {
      const { task_id, user_id, ...rest } = log;
      return {
        ...rest,
        user_id: user_id ? formatUserName(profilesById.get(user_id)) : null,
      };
    });

    // Build the prompt
    const prompt = `Eres un analista experto en gestión de proyectos. Analiza los siguientes datos y genera un reporte mensual completo en formato Markdown.

## Tareas Actuales (JSON):
\`\`\`json
${JSON.stringify(sanitizedTasks, null, 2)}
\`\`\`

## Registros de Actividad (Últimos 30 Días):
\`\`\`json
${JSON.stringify(sanitizedLogs, null, 2)}
\`\`\`

## Requisitos del Reporte:
1. **Resumen Ejecutivo** — Visión general del estado del proyecto
2. **Análisis de Productividad** — Tareas creadas vs completadas, tendencias de velocidad
3. **Evaluación de Riesgos** — Tareas atascadas, cuellos de botella en Review, tareas vencidas
4. **Actividad del Equipo** — Contribuyentes más activos según registros
5. **Recomendaciones** — Acciones concretas para mejorar el flujo
6. **Métricas Clave** — Tasa de completitud, tiempo promedio por estado, throughput

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
