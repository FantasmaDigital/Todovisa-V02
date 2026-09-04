import { AuthRepository } from "@/lib/repositories/auth.repository";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/emailService";
import { createPasswordResetEmail } from "@/lib/emailTemplates";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailInput = body.email || body.Email;

    if (!emailInput || typeof emailInput !== "string") {
      return NextResponse.json({ error: "El correo electrónico es requerido" }, { status: 400 });
    }

    const email = emailInput.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/i.test(email)) {
      return NextResponse.json({ error: "El formato del correo no es válido" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://todovisa.com';
    const resetUrl = `${appUrl}/auth/reset-password?email=${encodeURIComponent(email)}`;

    const { error } = await AuthRepository.resetPasswordForEmail(email, { redirectTo: resetUrl });

    if (error) {
      console.error("Supabase Password Reset Error:", error);
      return NextResponse.json({ error: error.message || "Error al solicitar el restablecimiento en Supabase" }, { status: 400 });
    }

    // Trigger branded email with custom template via SMTP
    const emailResult = await sendEmail({
      to: email,
      subject: "Restablecer tu contraseña - TodoVisa",
      html: createPasswordResetEmail("", resetUrl),
    });

    if (!emailResult.success) {
      console.warn("Correo SMTP no enviado (verifique credenciales), pero solicitud registrada:", emailResult.error);
    }

    return NextResponse.json(
      {
        message: "Se ha enviado un correo con las instrucciones para restablecer tu contraseña.",
        resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("ForgotPassword catch error:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}