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

    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const admin = getAdminSupabase();
    const { data: invite, error: inviteError } = await admin
      .from("board_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 400 });
    }

    if (invite.revoked_at) {
      return NextResponse.json({ error: "Invitation revoked" }, { status: 400 });
    }

    if (invite.accepted_at) {
      return NextResponse.json({ error: "Invitation already accepted" }, { status: 400 });
    }

    const now = new Date();
    if (new Date(invite.expires_at) < now) {
      return NextResponse.json({ error: "Invitation expired" }, { status: 400 });
    }

    // No email check — any authenticated user can accept a link invitation

    // Check if user already a member of this board
    const { data: existingMember } = await admin
      .from("board_members")
      .select("id, status")
      .eq("board_id", invite.board_id)
      .eq("user_id", user.id)
      .single();

    if (existingMember && existingMember.status === "active") {
      // Already a member, just mark invitation accepted
      await admin
        .from("board_invitations")
        .update({ accepted_at: now.toISOString() })
        .eq("id", invite.id);
      return NextResponse.json({ status: "already_member", boardId: invite.board_id });
    }

    // Ensure profile exists
    const { data: profile } = await admin
      .from("profiles")
      .select("id, active_board_id, full_name")
      .eq("id", user.id)
      .single();

    if (!profile) {
      const { error: createProfileError } = await admin
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          active_board_id: invite.board_id,
        });
      if (createProfileError) throw createProfileError;
    }

    // Switch active board
    await admin
      .from("profiles")
      .update({ active_board_id: invite.board_id })
      .eq("id", user.id);

    // Add as board member
    const { error: memberError } = await admin
      .from("board_members")
      .upsert({
        board_id: invite.board_id,
        user_id: user.id,
        role: invite.role,
        status: "active",
        invited_by: invite.invited_by,
      }, { onConflict: "board_id,user_id" });

    if (memberError) throw memberError;

    // Mark invitation as accepted
    await admin
      .from("board_invitations")
      .update({ accepted_at: now.toISOString() })
      .eq("id", invite.id);

    // Get board name for notification
    const { data: board } = await admin
      .from("boards")
      .select("name")
      .eq("id", invite.board_id)
      .single();

    const userName = profile?.full_name || user.email || "Someone";

    // Notify all existing board members about the new member
    const { data: boardMembers } = await admin
      .from("board_members")
      .select("user_id")
      .eq("board_id", invite.board_id)
      .eq("status", "active");

    if (boardMembers) {
      const notifications = boardMembers
        .filter(m => m.user_id !== user.id)
        .map(m => ({
          user_id: m.user_id,
          board_id: invite.board_id,
          type: "member_joined",
          title: "New collaborator joined",
          body: `${userName} joined the board "${board?.name || "Unknown"}"`,
          metadata: { new_user_id: user.id, role: invite.role },
        }));

      if (notifications.length > 0) {
        await admin.from("notifications").insert(notifications);
      }
    }

    return NextResponse.json({ status: "accepted", boardId: invite.board_id });
  } catch (error: any) {
    console.error("Accept Invite Error:", error);
    return NextResponse.json({ error: error.message || "Failed to accept" }, { status: 500 });
  }
}
