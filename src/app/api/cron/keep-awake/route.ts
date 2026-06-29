import supabase from "@/app/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Realizamos una consulta ultra ligera para despertar la base de datos
    // Limit 1 para no consumir recursos innecesarios
    const { data, error } = await supabase
      .from("agent_applications")
      .select("application_id")
      .limit(1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: "Supabase connection is active. Database keep-awake succeeded.",
      count: data?.length || 0
    }, { status: 200 });
  } catch (err: unknown) {
    console.error("Keep-awake database cron failed:", err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: errorMessage || "Error al conectar con la base de datos de Supabase."
    }, { status: 500 });
  }
}
