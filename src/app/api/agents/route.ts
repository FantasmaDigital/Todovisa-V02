import { AgentRepository } from "@/lib/repositories/agent.repository";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // ⚡ Parallel: both queries are independent — run them together
    const [agenciesData, agentsData] = await Promise.all([
      AgentRepository.getAgenciesWithApplications(),
      AgentRepository.getActiveIndependentAgents(),
    ]);

    const { agencyProfiles, agencyAppsMap } = agenciesData;
    const { activeApps, agencyMemberIds } = agentsData;

    return NextResponse.json(
      {
        data: {
          agencyProfiles,
          agencyAppsMap,
          activeApps,
          agencyMemberIds,
        },
      },
      {
        status: 200,
        headers: {
          // Cache directory data for 30s on edge, serve stale up to 60s while revalidating
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err: any) {
    console.error("GET /api/agents error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch agents data" }, { status: 500 });
  }
}
