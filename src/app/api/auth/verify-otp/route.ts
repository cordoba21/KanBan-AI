import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
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
            "Código de verificación inválido o expirado. Intenta de nuevo.",
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
        { error: "Error al actualizar la contraseña. Intenta de nuevo." },
        { status: 500 }
      );
    }

    // Sign out so the user logs in with the new password
    await supabase.auth.signOut();

    return NextResponse.json({
      message: "Contraseña actualizada exitosamente.",
    });
  } catch {
    return NextResponse.json(
      { error: "Error al procesar la solicitud." },
      { status: 500 }
    );
  }
}
