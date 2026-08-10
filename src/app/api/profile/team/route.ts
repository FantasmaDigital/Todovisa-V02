import { ProfileRepository } from "@/lib/repositories/profile.repository";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get("agencyId");

    if (!agencyId) {
      return NextResponse.json({ error: "agencyId parameter is required" }, { status: 400 });
    }

    const members = await ProfileRepository.getAgencyMembers(agencyId);
    const invitations = await ProfileRepository.getAgencyInvitations(agencyId);

    return NextResponse.json({ data: { members, invitations } }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/profile/team error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch team data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const invitationData = await request.json();

    if (!invitationData.agency_id || !invitationData.email) {
      return NextResponse.json({ error: "agency_id and email are required" }, { status: 400 });
    }

    const data = await ProfileRepository.createAgencyInvitation(invitationData);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/profile/team error:", err);
    return NextResponse.json({ error: err.message || "Failed to create invitation" }, { status: 500 });
  }
}
