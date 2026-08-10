import { AuthRepository } from "@/lib/repositories/auth.repository";
import { NextResponse } from "next/server";

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

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
    }

    const { data, error } = await AuthRepository.signUp({
      email,
      password,
      first_name,
      last_name,
      phone,
      country,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

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