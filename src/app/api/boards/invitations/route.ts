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

    const { role, boardId } = await request.json();

    const resolvedBoardId = typeof boardId === "string" && boardId.length > 0
      ? boardId
      : null;

    let boardToInvite = resolvedBoardId;
    if (!boardToInvite) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_board_id")
        .eq("id", user.id)
        .single();

      if (!profile?.active_board_id) {
        return NextResponse.json({ error: "No active board" }, { status: 400 });
      }
      boardToInvite = profile.active_board_id;
    }

    const { data: board } = await supabase
      .from("boards")
      .select("owner_id, name")
      .eq("id", boardToInvite)
      .single();

    if (!board || board.owner_id !== user.id) {
      const { data: membership } = await supabase
        .from("board_members")
        .select("role, status")
        .eq("board_id", boardToInvite)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (!membership || membership.role !== "OWNER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    const origin = new URL(request.url).origin;
    const inviteUrl = `${origin}/invitation?token=${token}`;

    const admin = getAdminSupabase();
    const { error } = await admin
      .from("board_invitations")
      .insert({
        board_id: boardToInvite,
        email: null,
        role: role || "VIEWER",
        token,
        invited_by: user.id,
        expires_at: expiresAt,
      });

    if (error) throw error;

    // Create notification for the board owner about the invite link
    const { data: boardMembers } = await admin
      .from("board_members")
      .select("user_id")
      .eq("board_id", boardToInvite)
      .eq("status", "active");

    if (boardMembers) {
      const notifications = boardMembers
        .filter(m => m.user_id !== user.id)
        .map(m => ({
          user_id: m.user_id,
          board_id: boardToInvite!,
          type: "invite_created",
          title: "New invite link created",
          body: `An invite link was generated for board "${board?.name || "Unknown"}"`,
          metadata: { invited_by: user.id, role: role || "VIEWER" },
        }));

      if (notifications.length > 0) {
        await admin.from("notifications").insert(notifications);
      }
    }

    return NextResponse.json({
      token,
      inviteUrl,
      expiresAt,
      boardName: board?.name || null,
    });
  } catch (error: any) {
    console.error("Invite Error:", error);
    return NextResponse.json({ error: error.message || "Failed to invite" }, { status: 500 });
  }
}
