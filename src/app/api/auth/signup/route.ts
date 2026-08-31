import { AuthRepository } from "@/lib/repositories/auth.repository";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/emailService";
import { createAccountWelcomeEmail } from "@/lib/emailTemplates";

export async function POST(request: Request) {
  let email = "", password = "", first_name = "", last_name = "", phone = "", country = "";
  try {
    const body = await request.json();
    email = body.email;
    password = body.password;
    first_name = body.first_name;
    last_name = body.last_name;
    phone = body.phone;
    country = body.country;

    const sanitizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const sanitizedPassword = typeof password === "string" ? password : "";
    const sanitizedFirstName = typeof first_name === "string" ? first_name.trim() : "";
    const sanitizedLastName = typeof last_name === "string" ? last_name.trim() : "";

    if (!sanitizedEmail || !sanitizedPassword) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
    }

    if (sanitizedPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const { data, error } = await AuthRepository.signUp({
      email: sanitizedEmail,
      password: sanitizedPassword,
      first_name: sanitizedFirstName,
      last_name: sanitizedLastName,
      phone,
      country,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Trigger Welcome Email (non-blocking)
    const displayName = [sanitizedFirstName, sanitizedLastName].filter(Boolean).join(" ") || "Cliente";
    sendEmail({
      to: sanitizedEmail,
      subject: "¡Bienvenido a TodoVisa! Tu cuenta ha sido creada",
      html: createAccountWelcomeEmail(displayName, sanitizedEmail),
    }).catch((e) => console.error("Error sending welcome email:", e));

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("SignUp catch error:", err);
    const isOffline =
      err.message?.includes("fetch failed") ||
      err.message?.includes("ENOTFOUND") ||
      err.message?.includes("fetch");
    if (isOffline) {
      console.log("⚠️ Conexión de red no disponible en Supabase. Creando cuenta en MODO DEMO local.");
      return NextResponse.json(
        {
          data: {
            user: {
              id: "demo-user-123",
              email: "demo@todovisa.com",
              user_metadata: {
                first_name: first_name || "Juan (Modo Demo)",
                last_name: last_name || "Pérez",
                phone: phone || "+503 7000 0000",
                country: country || "El Salvador",
              },
            },
            session: { access_token: "demo-token" },
          },
          is_demo: true,
        },
        { status: 200 }
      );
    }
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}