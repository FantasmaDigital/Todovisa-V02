import { NextResponse } from "next/server";
import { otpStore } from "@/lib/otpStore";
import { sendEmail } from "@/lib/emailService";
import { createOtpVerificationEmail } from "@/lib/emailTemplates";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, purpose = "verification", name } = body;

    const sanitizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!sanitizedEmail || !/^\S+@\S+\.\S+$/i.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: "Un correo electrónico válido es obligatorio" },
        { status: 400 }
      );
    }

    const otpRes = otpStore.generateOtp(sanitizedEmail, purpose);

    if (!otpRes.canSend || !otpRes.code) {
      return NextResponse.json(
        {
          error: otpRes.error || "Debes esperar antes de solicitar un nuevo código",
          remainingSeconds: otpRes.remainingSeconds || 60,
        },
        { status: 429 }
      );
    }

    const purposeMap: Record<string, string> = {
      verification: "Verificación de Cuenta",
      login: "Inicio de Sesión Seguro",
      password_reset: "Restablecimiento de Contraseña",
      identity_confirm: "Confirmación de Identidad",
    };
    const purposeLabel = purposeMap[purpose] || purpose;

    // Send email using branded template
    const emailResult = await sendEmail({
      to: sanitizedEmail,
      subject: `Tu código de verificación OTP: ${otpRes.code} - TodoVisa`,
      html: createOtpVerificationEmail(otpRes.code, purposeLabel, name || sanitizedEmail.split("@")[0]),
    });

    console.log(`[OTP API] Sent OTP code ${otpRes.code} to ${sanitizedEmail} (Purpose: ${purpose})`);

    return NextResponse.json(
      {
        success: true,
        message: "Código de verificación enviado correctamente a tu correo.",
        expiresAt: otpRes.expiresAt,
        simulated: emailResult.simulated || false,
        // In simulated mode, include demo code for developer testing convenience
        ...(emailResult.simulated ? { debugCode: otpRes.code } : {}),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[OTP Send Error]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al enviar el código de verificación" },
      { status: 500 }
    );
  }
}
