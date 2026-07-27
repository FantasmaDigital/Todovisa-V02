import { AuthRepository } from "@/lib/repositories/auth.repository";
import { NextResponse } from "next/server";

import supabase from "@/app/lib/supabase";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    if (token) {
      await supabase.auth.setSession({ access_token: token, refresh_token: "" }).catch(() => null);
    }

    const { data, error } = await AuthRepository.getUser();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.log("ℹ️ [Server Auth] Sesión de usuario verificada/iniciada:", {
      id: data?.user?.id,
      email: data?.user?.email,
      metadata: data?.user?.user_metadata,
    });

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("getUser server catch error:", err);
    const isOffline =
      err.message?.includes("fetch failed") ||
      err.message?.includes("ENOTFOUND") ||
      err.message?.includes("fetch");
    if (isOffline) {
      console.log("⚠️ Conexión de red no disponible en Supabase. Devolviendo usuario MODO DEMO local.");
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
          },
          is_demo: true,
        },
        { status: 200 }
      );
    }
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}