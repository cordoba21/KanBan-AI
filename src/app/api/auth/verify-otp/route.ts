import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the OTP token
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery",
    });

    if (verifyError) {
      return NextResponse.json(
        {
          error:
            "Invalid or expired verification code. Please try again.",
        },
        { status: 400 }
      );
    }

    // Update the password
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
