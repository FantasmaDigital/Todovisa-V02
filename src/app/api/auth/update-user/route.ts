import { AuthRepository } from "@/lib/repositories/auth.repository";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
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
