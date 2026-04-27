import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined, // OTP flow — no redirect, code is entered manually
    });

    if (error) {
      // Don't reveal if the email exists or not for security
      console.error("Reset password error:", error.message);
    }

    // Always return success to prevent email enumeration attacks
    return NextResponse.json({
      message:
        "If this email is registered, you will receive a verification code.",
    });
  } catch {
    return NextResponse.json(
      { error: "Error processing the request." },
      { status: 500 }
    );
  }
}
