import { AuthRepository } from "@/lib/repositories/auth.repository";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const sanitizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const sanitizedPassword = typeof password === "string" ? password : "";

    if (!sanitizedEmail || !sanitizedPassword) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
    }

    const { data, error } = await AuthRepository.signIn(sanitizedEmail, sanitizedPassword);

    if (error) {
      // Prevención de enumeración de usuarios: mensaje de error genérico para autenticación fallida
      return NextResponse.json({ error: "Credenciales de acceso no válidas" }, { status: 401 });
    }

    console.log("ℹ️ [Server Auth] Usuario inició sesión exitosamente (Email/Password):", {
      id: data?.user?.id,
      email: data?.user?.email,
      metadata: data?.user?.user_metadata,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("SignIn catch error:", err);
    const isOffline =
      err.message?.includes("fetch failed") ||
      err.message?.includes("ENOTFOUND") ||
      err.message?.includes("fetch");
    if (isOffline) {
      console.log("⚠️ Conexión de red no disponible en Supabase. Iniciando sesión en MODO DEMO local.");
      return NextResponse.json(
        {
          data: {
            user: {
              id: "demo-user-123",
              email: "demo@todovisa.com",
              user_metadata: {
                first_name: "Juan (Modo Demo)",
                last_name: "Pérez",
                phone: "+503 7000 0000",
                country: "El Salvador",
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
