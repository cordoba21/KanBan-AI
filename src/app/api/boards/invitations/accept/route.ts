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

    if (invite.email.toLowerCase() !== (user.email || "").toLowerCase()) {
      return NextResponse.json({ error: "Email mismatch" }, { status: 403 });
    }

    let profileData: { id: string; active_board_id: string | null } | null = null;

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, active_board_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      const { error: createProfileError } = await admin
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email || invite.email,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          active_board_id: invite.board_id,
        });
      if (createProfileError) throw createProfileError;
      profileData = { id: user.id, active_board_id: invite.board_id };
    } else {
      profileData = profile;
    }

    await admin
      .from("profiles")
      .update({ active_board_id: invite.board_id })
      .eq("id", user.id);

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

    const { error: invitationUpdateError } = await admin
      .from("board_invitations")
      .update({ accepted_at: now.toISOString() })
      .eq("id", invite.id);

    if (invitationUpdateError) throw invitationUpdateError;

    return NextResponse.json({ status: "accepted", boardId: invite.board_id });
  } catch (error: any) {
    console.error("Accept Invite Error:", error);
    return NextResponse.json({ error: error.message || "Failed to accept" }, { status: 500 });
  }
}
