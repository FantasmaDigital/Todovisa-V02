import { AgentRepository } from "@/lib/repositories/agent.repository";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;

    const portalDetails = await AgentRepository.getPortalDetails(userId);
    return NextResponse.json({ data: portalDetails }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/agents/portal error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch portal data" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, userId, updates } = await request.json();

    if (!updates) {
      return NextResponse.json({ error: "Updates object is required" }, { status: 400 });
    }

    let result;
    if (id) {
      result = await AgentRepository.updateApplication(id, updates);
    } else if (userId) {
      result = await AgentRepository.updateApplicationByUserId(userId, updates);
    } else {
      return NextResponse.json({ error: "Either id or userId must be provided" }, { status: 400 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /api/agents/portal error:", err);
    return NextResponse.json({ error: err.message || "Failed to update application" }, { status: 500 });
  }
}
