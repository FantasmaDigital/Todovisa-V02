import { ProfileRepository } from "@/lib/repositories/profile.repository";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json({ error: "agentId parameter is required" }, { status: 400 });
    }

    const payouts = await ProfileRepository.getPayoutsByAgentId(agentId);
    return NextResponse.json({ data: payouts }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/profile/payouts error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch payouts" }, { status: 500 });
  }
}
