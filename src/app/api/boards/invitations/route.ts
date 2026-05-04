import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

function getAdminSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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

function generateToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function POST(request: Request) {
  try {
    const supabase = await getAuthedSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, role } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("active_board_id")
      .eq("id", user.id)
      .single();

    if (!profile?.active_board_id) {
      return NextResponse.json({ error: "No active board" }, { status: 400 });
    }

    const { data: board } = await supabase
      .from("boards")
      .select("owner_id")
      .eq("id", profile.active_board_id)
      .single();

    if (!board || board.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    const origin = new URL(request.url).origin;
    const inviteUrl = `${origin}/invitation?token=${token}`;

    const admin = getAdminSupabase();
    const { error } = await admin
      .from("board_invitations")
      .insert({
        board_id: profile.active_board_id,
        email: email.toLowerCase(),
        role: role || "VIEWER",
        token,
        invited_by: user.id,
        expires_at: expiresAt,
      });

    if (error) throw error;

    return NextResponse.json({
      token,
      inviteUrl,
      email: email.toLowerCase(),
      expiresAt,
    });
  } catch (error: any) {
    console.error("Invite Error:", error);
    return NextResponse.json({ error: error.message || "Failed to invite" }, { status: 500 });
  }
}
