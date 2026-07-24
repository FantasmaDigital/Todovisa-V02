import { AgentRepository } from "@/lib/repositories/agent.repository";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { agencyProfiles, agencyAppsMap } = await AgentRepository.getAgenciesWithApplications();
    const { activeApps, agencyMemberIds } = await AgentRepository.getActiveIndependentAgents();

    return NextResponse.json(
      {
        data: {
          agencyProfiles,
          agencyAppsMap,
          activeApps,
          agencyMemberIds,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("GET /api/agents error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch agents data" }, { status: 500 });
  }
}
