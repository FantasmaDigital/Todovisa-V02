import { AgentRepository } from "@/lib/repositories/agent.repository";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }

    const reviews = await AgentRepository.getAgentReviews(agentId);
    return NextResponse.json({ data: reviews }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/agents/reviews error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agent_id, reviewer_id, reviewer_name, rating, comment } = body;

    if (!agent_id || !rating) {
      return NextResponse.json({ error: "agent_id and rating are required" }, { status: 400 });
    }

    const newReview = await AgentRepository.createAgentReview({
      agent_id,
      reviewer_id,
      reviewer_name,
      rating: Number(rating),
      comment: comment || "",
    });

    return NextResponse.json({ data: newReview }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/agents/reviews error:", err);
    return NextResponse.json({ error: err.message || "Failed to create review" }, { status: 500 });
  }
}
