import { AuthRepository } from "@/lib/repositories/auth.repository";
import { NextResponse } from "next/server";

import supabase from "@/app/lib/supabase";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    const { metadata } = await request.json();

    if (!metadata) {
      console.error("[POST /api/auth/update-user] Error: Metadata is required");
      return NextResponse.json({ error: "Metadata is required" }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ error: "Auth session missing" }, { status: 401 });
    }

    const { data, error } = await AuthRepository.updateUserMetadata(metadata, token);

    if (error) {
      console.error("[POST /api/auth/update-user] Supabase Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("[POST /api/auth/update-user] Internal Catch Error:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}
