import { ProfileRepository } from "@/lib/repositories/profile.repository";
import { NextResponse } from "next/server";
import supabase from "@/app/lib/supabase";

export async function GET(request: Request) {
  try {


    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const all = searchParams.get("all");

    if (all === "true" || !userId) {
      const profiles = await ProfileRepository.getAllProfiles();
      return NextResponse.json({ data: profiles }, { status: 200 });
    }

    const profile = await ProfileRepository.getProfileById(userId);
    const memberInfo = await ProfileRepository.getAgencyMemberInfo(userId);

    return NextResponse.json({ data: { profile, memberInfo } }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {


    const { userId, updates } = await request.json();

    if (!userId || !updates) {
      return NextResponse.json({ error: "userId and updates are required" }, { status: 400 });
    }

    const data = await ProfileRepository.updateProfile(userId, updates);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /api/profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
