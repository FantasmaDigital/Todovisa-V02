import { SettingsRepository } from "@/lib/repositories/settings.repository";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rawSettings = await SettingsRepository.getAllSettings();
    
    // Map array of settings to a simple key-value object
    const settingsMap = rawSettings.reduce((acc, current) => {
      acc[current.key] = current.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ success: true, data: settingsMap }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/settings error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Settings object is required" }, { status: 400 });
    }

    // Transform key-value object to array of { key, value }
    const settingsArray = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value),
    }));

    if (settingsArray.length === 0) {
      return NextResponse.json({ error: "No settings provided to update" }, { status: 400 });
    }

    const data = await SettingsRepository.updateSettings(settingsArray);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /api/settings error:", err);
    return NextResponse.json({ error: err.message || "Failed to update settings" }, { status: 500 });
  }
}
