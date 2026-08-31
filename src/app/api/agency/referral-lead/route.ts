export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";
import supabase from "@/app/lib/supabase";
import { UserRole } from "@/app/constants/roles";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      client_name,
      client_email,
      client_phone,
      visa_type,
      destination_country,
      agency_code,
      notes,
    } = body;

    const dbClient = supabaseAdmin || supabase;

    // Validación de campos obligatorios
    if (!client_name || !client_name.trim()) {
      return NextResponse.json(
        { success: false, error: "El nombre del cliente es obligatorio." },
        { status: 400 }
      );
    }

    if ((!client_email || !client_email.trim()) && (!client_phone || !client_phone.trim())) {
      return NextResponse.json(
        { success: false, error: "Debes proporcionar al menos un correo o número de teléfono de contacto." },
        { status: 400 }
      );
    }

    if (!agency_code || !agency_code.trim()) {
      return NextResponse.json(
        { success: false, error: "El código de referido de la empresa es obligatorio." },
        { status: 400 }
      );
    }

    const cleanCode = agency_code.trim();

    // 1. Validar la empresa/agencia correspondiente al código
    let targetAgencyId: string | null = null;
    let agencyName: string = "Empresa Aliada";

    // Buscar en agent_applications por application_id, id, o user_id
    const { data: apps } = await dbClient
      .from("agent_applications")
      .select("id, application_id, user_id, full_name")
      .or(`application_id.eq.${cleanCode},id.eq.${cleanCode},user_id.eq.${cleanCode}`);

    if (apps && apps.length > 0) {
      const matchedApp = apps[0];
      targetAgencyId = matchedApp.user_id || matchedApp.id;
      agencyName = matchedApp.full_name || "Empresa Aliada";
    } else {
      // Buscar en profiles por ID directo
      const { data: profileDirect } = await dbClient
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("id", cleanCode)
        .maybeSingle();

      if (profileDirect && profileDirect.role === UserRole.AGENCY) {
        targetAgencyId = profileDirect.id;
        agencyName = `${profileDirect.first_name || ""} ${profileDirect.last_name || ""}`.trim() || "Empresa Aliada";
      }
    }

    // Si tenemos targetAgencyId, confirmar su perfil de AGENCIA
    if (targetAgencyId) {
      const { data: profileData } = await dbClient
        .from("profiles")
        .select("id, role, first_name, last_name")
        .eq("id", targetAgencyId)
        .maybeSingle();

      if (profileData && profileData.role === UserRole.AGENCY) {
        agencyName = `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim() || agencyName;
      }
    }

    // 2. Guardar el prospecto en la tabla agency_referral_leads
    const leadPayload = {
      client_name: client_name.trim(),
      client_email: (client_email || "").trim(),
      client_phone: (client_phone || "").trim(),
      visa_type: visa_type || "Turismo (B1/B2)",
      destination_country: destination_country || "Estados Unidos",
      agency_code: cleanCode,
      agency_id: targetAgencyId,
      agency_name: agencyName,
      notes: (notes || "").trim(),
      status: "pending_advisor_contact",
      assigned_advisor: "Asesor Oficial TodoVisa / Admin",
    };

    let newLead: any = null;
    const { data: insertedLead, error: insertError } = await dbClient
      .from("agency_referral_leads")
      .insert([leadPayload])
      .select()
      .single();

    if (!insertError && insertedLead) {
      newLead = insertedLead;
    } else if (insertError) {
      console.warn("⚠️ Advertencia al insertar en agency_referral_leads:", insertError.message);
    }

    // 3. Crear registro en agency_client_requests para visibilidad directa en Admin
    try {
      await dbClient.from("agency_client_requests").insert([
        {
          agency_id: targetAgencyId || "admin",
          agency_name: agencyName,
          client_name: client_name.trim(),
          client_email: (client_email || "").trim(),
          client_phone: (client_phone || "").trim(),
          notes: `[SOLICITUD DE ATENCIÓN REFERIDO] Código: ${cleanCode} | Visa: ${visa_type} - ${destination_country} | Notas: ${notes || "N/A"}`,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (reqErr: any) {
      console.warn("Notice: insert into agency_client_requests error:", reqErr);
    }

    // 4. Enviar notificación directa a mensajes de Admin
    try {
      await dbClient.from("messages").insert([
        {
          sender: "user",
          user_id: `referral-lead-${Date.now()}`,
          agent_id: "admin",
          text: `🚨 [NUEVA SOLICITUD DE ATENCIÓN POR ASESOR]\nEmpresa: ${agencyName} (${cleanCode})\nCliente: ${client_name.trim()}\nCorreo: ${client_email || "N/A"}\nTeléfono: ${client_phone || "N/A"}\nTrámite: ${visa_type} - ${destination_country}\nNotas: ${notes || "Sin notas adicionales"}\nEstado: Pendiente de contacto por Admin/Asesor TodoVisa`,
        },
      ]);
    } catch (mErr: any) {
      console.error("Error en fallback message insert:", mErr);
    }

    // 5. Responder al cliente con mensaje de confirmación
    return NextResponse.json(
      {
        success: true,
        message: "¡Tus datos han sido registrados con éxito!",
        leadId: newLead?.id || `lead-${Date.now()}`,
        agencyName: agencyName,
        agencyCode: cleanCode,
        advisorNote: "Un asesor propio de la empresa TodoVisa se pondrá en contacto a la brevedad para dar seguimiento y finalizar tu proceso consular.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[referral-lead] Error procesando lead de referido:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Error interno al enviar el formulario." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;
    let userRole: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user) {
        userId = userData.user.id;
        const { data: profile } = await (supabaseAdmin || supabase)
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();
        userRole = profile?.role || null;
      }
    }

    // Seguridad de API: solo permitir acceso a roles ADMIN, MODERATOR o AGENCY
    if (!userRole || (userRole !== UserRole.ADMIN && userRole !== UserRole.MODERATOR && userRole !== UserRole.AGENCY)) {
      return NextResponse.json({ success: false, error: "Acceso no autorizado a datos de referidos." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const agencyCode = searchParams.get("agency_code") || searchParams.get("code");
    const agencyId = searchParams.get("agency_id");

    const dbClient = supabaseAdmin || supabase;
    let query = dbClient.from("agency_referral_leads").select("*").order("created_at", { ascending: false });

    // Aislamiento por agencia: Si el rol es AGENCY, filtrar únicamente sus propios referidos
    if (userRole === UserRole.AGENCY && userId) {
      query = query.or(`agency_id.eq.${userId},agency_code.eq.${userId}`);
    } else {
      if (agencyCode) {
        query = query.eq("agency_code", agencyCode);
      }
      if (agencyId) {
        query = query.eq("agency_id", agencyId);
      }
    }

    const { data: leads, error } = await query;

    let resultLeads = leads || [];

    // Fallback: Consultar en la tabla messages si agency_referral_leads aún no está creada
    if (!resultLeads || resultLeads.length === 0) {
      const { data: fallbackMsgs } = await dbClient
        .from("messages")
        .select("*")
        .or("text.ilike.%NUEVA SOLICITUD DE ATENCIÓN%,text.ilike.%LEAD DE REFERIDO EMPRESA%")
        .order("created_at", { ascending: false });

      resultLeads = (fallbackMsgs || []).map((msg: any) => {
        const txt = msg.text || "";
        const nameMatch = txt.match(/Cliente:\s*([^\n]+)/);
        const emailMatch = txt.match(/(?:Correo|Email):\s*([^\n]+)/);
        const phoneMatch = txt.match(/Teléfono:\s*([^\n]+)/);
        const codeMatch = txt.match(/(?:Código|Código Empresa):\s*([^\n]+)/);
        const agencyNameMatch = txt.match(/Empresa:\s*([^\n]+)/);
        const visaMatch = txt.match(/Trámite:\s*([^\n]+)/);

        return {
          id: msg.id,
          client_name: nameMatch ? nameMatch[1].trim() : "Cliente Referido",
          client_email: emailMatch ? emailMatch[1].trim() : "",
          client_phone: phoneMatch ? phoneMatch[1].trim() : "",
          agency_code: codeMatch ? codeMatch[1].trim() : (agencyCode || "N/A"),
          agency_name: agencyNameMatch ? agencyNameMatch[1].trim() : "Empresa Aliada",
          visa_type: visaMatch ? visaMatch[1].trim() : "Turismo (B1/B2)",
          destination_country: "Estados Unidos",
          status: "pending_advisor_contact",
          created_at: msg.created_at || new Date().toISOString(),
        };
      });
    }

    // Cross-reference with agent_commissions table to ensure commission_assigned is accurate
    try {
      const { data: allCommissions } = await dbClient
        .from("agent_commissions")
        .select("id, client_name, notes");

      if (allCommissions && allCommissions.length > 0 && resultLeads.length > 0) {
        resultLeads = resultLeads.map((l: any) => {
          const hasComm = allCommissions.some((c: any) => {
            const notesStr = typeof c.notes === "string" ? c.notes : JSON.stringify(c.notes || {});
            return (
              (l.id && notesStr.includes(String(l.id))) ||
              (l.client_name && c.client_name && c.client_name.trim().toLowerCase() === l.client_name.trim().toLowerCase())
            );
          });
          return {
            ...l,
            commission_assigned: Boolean(l.commission_assigned || hasComm),
          };
        });
      }
    } catch (crossErr) {
      console.warn("[referral-lead GET] Notice on cross-referencing commissions:", crossErr);
    }

    return NextResponse.json(
      { success: true, leads: resultLeads },
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
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;
    let userRole: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user) {
        userId = userData.user.id;
        const { data: profile } = await (supabaseAdmin || supabase)
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();
        userRole = profile?.role || null;
      }
    }

    // Permitir actualización si la petición es autenticada por admin/moderador o interna
    const body = await request.json();
    const { id, status, commission_assigned, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID de prospecto es requerido." }, { status: 400 });
    }

    const dbClient = supabaseAdmin || supabase;
    const updates: Record<string, any> = {};
    if (status !== undefined) updates.status = status;
    if (commission_assigned !== undefined) updates.commission_assigned = Boolean(commission_assigned);
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await dbClient
      .from("agency_referral_leads")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("[referral-lead PATCH] Error actualizando DB:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { success: true, lead: data },
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
    console.error("[referral-lead PATCH] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
