import { AgentRepository } from "@/lib/repositories/agent.repository";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId") || undefined;

    if (agentId) {
      const requests = await AgentRepository.getAgencyClientRequests(agentId);
      return NextResponse.json({ data: requests }, { status: 200 });
    }

    const applications = await AgentRepository.getAllApplications();
    const requests = await AgentRepository.getAgencyClientRequests();
    return NextResponse.json({ data: requests, applications }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/agents/requests error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch requests" }, { status: 500 });
  }
}

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
