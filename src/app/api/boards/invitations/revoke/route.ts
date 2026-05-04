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

export async function POST(request: Request) {
  try {
    const supabase = await getAuthedSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invitationId } = await request.json();
    if (!invitationId || typeof invitationId !== "string") {
      return NextResponse.json({ error: "Invitation ID is required" }, { status: 400 });
    }

    const admin = getAdminSupabase();
    const { data: invite, error: inviteError } = await admin
      .from("board_invitations")
      .select("board_id")
      .eq("id", invitationId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const { data: board, error: boardError } = await admin
      .from("boards")
      .select("owner_id")
      .eq("id", invite.board_id)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    if (board.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await admin
      .from("board_invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", invitationId);

    if (error) throw error;

    return NextResponse.json({ status: "revoked" });
  } catch (error: any) {
    console.error("Revoke Invite Error:", error);
    return NextResponse.json({ error: error.message || "Failed to revoke" }, { status: 500 });
  }
}
