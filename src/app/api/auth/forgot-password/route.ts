import { AuthRepository } from "@/lib/repositories/auth.repository";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/emailService";
import { createPasswordResetEmail } from "@/lib/emailTemplates";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "El correo electrónico es requerido" }, { status: 400 });
    }

    const { data, error } = await AuthRepository.resetPasswordForEmail(email);

    if (error) {
      console.error("Supabase Password Reset Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Trigger custom branded email (non-blocking)
    const resetUrl = (data as any)?.url || `${process.env.NEXT_PUBLIC_APP_URL || 'https://todovisa.com'}/auth/reset-password?email=${encodeURIComponent(email)}`;
    sendEmail({
      to: email,
      subject: "Restablecer tu contraseña - TodoVisa",
      html: createPasswordResetEmail("", resetUrl),
    }).catch((e) => console.error("Error sending password reset email:", e));

    return NextResponse.json(
      { message: "Se ha enviado un correo con instrucciones para restablecer tu contraseña." },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("ForgotPassword catch error:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}