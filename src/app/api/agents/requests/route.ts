import { AgentRepository } from "@/lib/repositories/agent.repository";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const requestData = await request.json();

    const result = await AgentRepository.createAgencyClientRequest(requestData);

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/agents/requests error:", err);
    return NextResponse.json({ error: err.message || "Failed to create client request" }, { status: 500 });
  }
}
