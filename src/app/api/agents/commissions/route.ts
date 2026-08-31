export const dynamic = "force-dynamic";
export const revalidate = 0;

import { AgentRepository } from "@/lib/repositories/agent.repository";
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import supabase from "@/app/lib/supabase";

export async function GET() {
  try {
    const dbClient = supabaseAdmin || supabase;
    const { data, error } = await dbClient.from("agent_commissions").select("*").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json(
      { data: data || [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (err: any) {
    console.error("GET /api/agents/commissions error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch commissions" }, { status: 500 });
  }
}

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
