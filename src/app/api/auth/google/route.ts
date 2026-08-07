import { AuthRepository } from "@/lib/repositories/auth.repository";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { redirectTo } = await request.json();

    const { data, error } = await AuthRepository.signInWithOAuth("google", redirectTo);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ url: data.url }, { status: 200 });
  } catch (err: any) {
    console.error("Google OAuth catch error:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}
