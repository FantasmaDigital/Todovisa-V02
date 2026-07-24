import { ProfileRepository } from "@/lib/repositories/profile.repository";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json({ error: "agentId parameter is required" }, { status: 400 });
    }

    const commissions = await ProfileRepository.getCommissionsByAgentId(agentId);
    return NextResponse.json({ data: commissions }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/profile/commissions error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch commissions" }, { status: 500 });
  }
}
