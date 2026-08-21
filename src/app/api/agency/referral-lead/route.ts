import { NextResponse } from "next/server";
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
    const { data: apps } = await supabase
      .from("agent_applications")
      .select("id, application_id, user_id, full_name")
      .or(`application_id.eq.${cleanCode},id.eq.${cleanCode},user_id.eq.${cleanCode}`);

    if (apps && apps.length > 0) {
      const matchedApp = apps[0];
      targetAgencyId = matchedApp.user_id || matchedApp.id;
      agencyName = matchedApp.full_name || "Empresa Aliada";

    } else {
      // Buscar en profiles por ID directo
      const { data: profileDirect } = await supabase
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
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, role, first_name, last_name")
        .eq("id", targetAgencyId)
        .maybeSingle();

      if (profileData && profileData.role === UserRole.AGENCY) {
        agencyName = `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim() || agencyName;
      }
    }

    // 2. Guardar el prospecto / lead de referido en la base de datos
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
      assigned_advisor: "Asesor Oficial TodoVisa",
    };

    const { data: newLead, error: insertError } = await supabase
      .from("agency_referral_leads")
      .insert([leadPayload])
      .select()
      .single();

    if (insertError) {
      console.warn("⚠️ No se pudo insertar en la tabla agency_referral_leads (usando fallback en mensajes):", insertError.message);
      try {
        await supabase.from("messages").insert([
          {
            sender: "user",
            user_id: `referral-lead-${Date.now()}`,
            agent_id: targetAgencyId || "todovisa-staff",
            text: `[NUEVO LEAD DE REFERIDO DE EMPRESA]\nEmpresa/Código: ${agencyName} (${cleanCode})\nCliente: ${client_name}\nCorreo: ${client_email}\nTeléfono: ${client_phone}\nTrámite: ${visa_type} - ${destination_country}\nNotas: ${notes || "Sin notas adicionales"}\nEstado: Pendiente de contacto por Asesor TodoVisa`,
          },
        ]);
      } catch (mErr: any) {
        console.error("Error en fallback message insert:", mErr);
      }
    }


    // 3. Responder al cliente con mensaje de confirmación
    return NextResponse.json(
      {
        success: true,
        message: "Formulario de contacto enviado correctamente.",
        leadId: newLead?.id || `lead-${Date.now()}`,
        agencyName: agencyName,
        agencyCode: cleanCode,
        advisorNote: "Un asesor propio de la empresa TodoVisa se pondrá en contacto a la brevedad para dar seguimiento y finalizar tu trámite consular.",
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
    const { searchParams } = new URL(request.url);
    const agencyCode = searchParams.get("agency_code") || searchParams.get("code");
    const agencyId = searchParams.get("agency_id");

    let query = supabase.from("agency_referral_leads").select("*").order("created_at", { ascending: false });

    if (agencyCode) {
      query = query.eq("agency_code", agencyCode);
    }
    if (agencyId) {
      query = query.eq("agency_id", agencyId);
    }

    const { data: leads, error } = await query;

    if (!error && leads) {
      return NextResponse.json({ success: true, leads: leads }, { status: 200 });
    }

    // Fallback: Consultar en la tabla messages si agency_referral_leads aún no está creada
    const { data: fallbackMsgs } = await supabase
      .from("messages")
      .select("*")
      .ilike("text", "%LEAD DE REFERIDO EMPRESA%")
      .order("created_at", { ascending: false });

    const parsedLeads = (fallbackMsgs || []).map((msg: any) => {
      const txt = msg.text || "";
      const nameMatch = txt.match(/Cliente:\s*([^\n]+)/);
      const emailMatch = txt.match(/Email:\s*([^\n]+)/);
      const phoneMatch = txt.match(/Teléfono:\s*([^\n]+)/);
      const codeMatch = txt.match(/Código Empresa:\s*([^\n]+)/);
      const agencyNameMatch = txt.match(/Empresa Aliada:\s*([^\n]+)/);
      const visaMatch = txt.match(/Trámite:\s*([^\n]+)/);
      const countryMatch = txt.match(/País:\s*([^\n]+)/);

      return {
        id: msg.id,
        client_name: nameMatch ? nameMatch[1].trim() : "Cliente Referido",
        client_email: emailMatch ? emailMatch[1].trim() : "",
        client_phone: phoneMatch ? phoneMatch[1].trim() : "",
        agency_code: codeMatch ? codeMatch[1].trim() : (agencyCode || "N/A"),
        agency_name: agencyNameMatch ? agencyNameMatch[1].trim() : "Empresa Aliada",
        visa_type: visaMatch ? visaMatch[1].trim() : "Turismo (B1/B2)",
        destination_country: countryMatch ? countryMatch[1].trim() : "Estados Unidos",
        status: "pending_advisor_contact",
        created_at: msg.created_at || new Date().toISOString()
      };
    });

    return NextResponse.json({ success: true, leads: parsedLeads }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

