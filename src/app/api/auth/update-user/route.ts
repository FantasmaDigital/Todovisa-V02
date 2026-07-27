import { AuthRepository } from "@/lib/repositories/auth.repository";
import { NextResponse } from "next/server";

import supabase from "@/app/lib/supabase";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    if (token) {
      await supabase.auth.setSession({ access_token: token, refresh_token: "" }).catch(() => null);
    }

    const { metadata } = await request.json();

    if (!metadata) {
      return NextResponse.json({ error: "Metadata is required" }, { status: 400 });
    }

    const { data, error } = await AuthRepository.updateUserMetadata(metadata);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("UpdateUser catch error:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}
