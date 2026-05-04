import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // The session was established by the previous OTP verification
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Session expired. Please verify your code again." },
        { status: 401 }
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return NextResponse.json(
        { error: "Error updating password. Please try again." },
        { status: 500 }
      );
    }

    // Sign out so the user logs in with the new password
    await supabase.auth.signOut();

    return NextResponse.json({
      message: "Password updated successfully.",
    });
  } catch {
    return NextResponse.json(
      { error: "Error processing the request." },
      { status: 500 }
    );
  }
}
