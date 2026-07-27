import { ProfileRepository } from "@/lib/repositories/profile.repository";
import { NextResponse } from "next/server";
import supabase from "@/app/lib/supabase";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    if (token) {
      await supabase.auth.setSession({ access_token: token, refresh_token: "" }).catch(() => null);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
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
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    if (token) {
      await supabase.auth.setSession({ access_token: token, refresh_token: "" }).catch(() => null);
    }

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
