import { AgentRepository } from "@/lib/repositories/agent.repository";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const commissionData = await request.json();

    const { data, error } = await AgentRepository.createAgentCommission(commissionData);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/agents/commissions error:", err);
    return NextResponse.json({ error: err.message || "Failed to log commission" }, { status: 500 });
  }
}
