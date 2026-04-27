import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and code are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the OTP token — this establishes a session
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

    // If newPassword is provided, update the password
    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters." },
          { status: 400 }
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
        passwordUpdated: true,
      });
    }

    // If no password provided, just confirm the OTP is valid
    return NextResponse.json({
      message: "Code verified successfully.",
      verified: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Error processing the request." },
      { status: 500 }
    );
  }
}
