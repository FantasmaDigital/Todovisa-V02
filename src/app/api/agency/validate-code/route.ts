import { NextResponse } from "next/server";
import supabase from "@/app/lib/supabase";
import { UserRole } from "@/app/constants/roles";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ valid: false, error: "Código no proporcionado" }, { status: 400 });
    }

    const cleanCode = code.trim();

    // 1. Buscar en agent_applications por application_id o id o por user_id que coincida
    const { data: apps, error: appErr } = await supabase
      .from("agent_applications")
      .select("id, application_id, user_id, full_name, agency_id, status")
      .or(`application_id.eq.${cleanCode},id.eq.${cleanCode},user_id.eq.${cleanCode}`);

    if (appErr) {
      console.error("[validate-code] Error consultando agent_applications:", appErr);
    }

    let targetAgencyId: string | null = null;
    let agencyName: string | null = null;

    if (apps && apps.length > 0) {
      const matchedApp = apps[0];
      targetAgencyId = matchedApp.user_id || matchedApp.agency_id || matchedApp.id;
      agencyName = matchedApp.full_name;
    } else {
      // 2. Si no se encontró por ID directo de aplicación, buscar en profiles por ID directo
      const { data: profileDirect } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("id", cleanCode)
        .maybeSingle();

      if (profileDirect && profileDirect.role === UserRole.AGENCY) {
        targetAgencyId = profileDirect.id;
        agencyName = `${profileDirect.first_name || ""} ${profileDirect.last_name || ""}`.trim() || "Agencia";
      }
    }

    if (!targetAgencyId) {
      return NextResponse.json({ valid: false, error: "El código no existe o no corresponde a una agencia" }, { status: 404 });
    }

    // 3. VERIFICAR QUE EL USUARIOS DUEÑO DEL CÓDIGO SEA ESTRICTAMENTE UNA AGENCIA
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, role, first_name, last_name")
      .eq("id", targetAgencyId)
      .maybeSingle();

    if (!profileData || profileData.role !== UserRole.AGENCY) {
      return NextResponse.json({
        valid: false,
        error: "Este código pertenece a un asesor independiente o usuario individual, no a una agencia."
      }, { status: 400 });
    }

    const finalAgencyName = agencyName || `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim() || "Agencia Aliada";

    return NextResponse.json({
      valid: true,
      agencyId: targetAgencyId,
      agencyName: finalAgencyName,
      code: cleanCode
    }, { status: 200 });

  } catch (err: any) {
    console.error("[validate-code] Catch error:", err);
    return NextResponse.json({ valid: false, error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}
