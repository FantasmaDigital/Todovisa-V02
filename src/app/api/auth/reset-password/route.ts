import { NextResponse } from "next/server";
import supabase, { getScopedSupabaseClient } from "@/app/lib/supabase";

export async function POST(request: Request) {
  try {
    const { password, access_token, refresh_token } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    let client = supabase;
    if (access_token) {
      client = getScopedSupabaseClient(access_token);
      await client.auth.setSession({
        access_token,
        refresh_token: refresh_token || access_token,
      });
    }

    const { data, error } = await client.auth.updateUser({
      password,
    });

    if (error) {
      console.error("Error updating user password:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Contraseña actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña." },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("ResetPassword POST error:", err);
    return NextResponse.json(
      { error: err.message || "Error al restablecer la contraseña" },
      { status: 500 }
    );
  }
}
