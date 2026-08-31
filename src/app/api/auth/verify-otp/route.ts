import { NextResponse } from "next/server";
import { otpStore } from "@/lib/otpStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code, purpose = "verification" } = body;

    const sanitizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const sanitizedCode = typeof code === "string" ? code.trim() : "";

    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: "El correo electrónico es requerido" },
        { status: 400 }
      );
    }

    if (!sanitizedCode || sanitizedCode.length !== 6 || !/^\d{6}$/.test(sanitizedCode)) {
      return NextResponse.json(
        { error: "El código debe ser una secuencia numérica de 6 dígitos" },
        { status: 400 }
      );
    }

    const verificationResult = otpStore.verifyOtp(sanitizedEmail, sanitizedCode, purpose);

    if (!verificationResult.valid) {
      return NextResponse.json(
        { valid: false, error: verificationResult.error },
        { status: 400 }
      );
    }

    console.log(`[OTP API] Verified OTP code successfully for ${sanitizedEmail} (Purpose: ${purpose})`);

    return NextResponse.json(
      {
        valid: true,
        message: verificationResult.message || "Código verificado correctamente.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[OTP Verify Error]:", error);
    return NextResponse.json(
      { error: error.message || "Error interno al verificar el código OTP" },
      { status: 500 }
    );
  }
}
