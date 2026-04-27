import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function DELETE(request: Request) {
  try {
    const { confirmation } = await request.json();

    if (confirmation !== "Delete my account") {
      return NextResponse.json(
        { error: "Please type 'Delete my account' to confirm." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    // Delete user data first (tasks, activity_logs, categories, profiles, archives)
    await supabase.from("activity_logs").delete().eq("user_id", user.id);
    await supabase.from("tasks").delete().eq("user_id", user.id);
    await supabase.from("categories").delete().eq("user_id", user.id);
    await supabase.from("archived_tasks").delete().eq("user_id", user.id);
    await supabase.from("archived_reports").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);

    // Delete the auth user using admin client
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Error deleting user:", deleteError.message);
      return NextResponse.json(
        { error: "Error deleting account. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Account deleted successfully.",
    });
  } catch (err) {
    console.error("Delete account error:", err);
    return NextResponse.json(
      { error: "Error processing the request." },
      { status: 500 }
    );
  }
}
