import { FormRepository } from "@/lib/repositories/form.repository";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const evalId = searchParams.get("evalId") || undefined;

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    const data = await FormRepository.getViproEvaluation(userId, evalId);
    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/forms/vipro error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch VIPRO evaluation" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const evalData = await request.json();

    const data = await FormRepository.saveViproEvaluation(evalData);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/forms/vipro error:", err);
    return NextResponse.json({ error: err.message || "Failed to save VIPRO evaluation" }, { status: 500 });
  }
}
