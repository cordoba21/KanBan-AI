import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "El correo electrónico es requerido." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined, // We use OTP flow, no redirect needed
    });

    if (error) {
      // Don't reveal if the email exists or not for security
      console.error("Reset password error:", error.message);
    }

    // Always return success to prevent email enumeration attacks
    return NextResponse.json({
      message:
        "Si el correo está registrado, recibirás un código de verificación.",
    });
  } catch {
    return NextResponse.json(
      { error: "Error al procesar la solicitud." },
      { status: 500 }
    );
  }
}
