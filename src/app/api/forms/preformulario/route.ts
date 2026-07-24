import { FormRepository } from "@/lib/repositories/form.repository";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    const data = await FormRepository.getPreformularioProgress(userId);
    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/forms/preformulario error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch preformulario progress" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, formData, currentStep, isCompleted } = await request.json();

    if (!userId || !formData) {
      return NextResponse.json({ error: "userId and formData are required" }, { status: 400 });
    }

    const data = await FormRepository.savePreformularioProgress(userId, formData, currentStep || 1, isCompleted || false);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/forms/preformulario error:", err);
    return NextResponse.json({ error: err.message || "Failed to save preformulario progress" }, { status: 500 });
  }
}
