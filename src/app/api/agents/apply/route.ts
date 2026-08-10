import { AgentRepository } from "@/lib/repositories/agent.repository";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const applicationData = await request.json();

    if (!applicationData.application_id || !applicationData.email) {
      return NextResponse.json({ error: "Application ID and Email are required" }, { status: 400 });
    }

    const { data, error } = await AgentRepository.createApplication(applicationData);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data, success: true }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/agents/apply error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit agent application" }, { status: 500 });
  }
}
