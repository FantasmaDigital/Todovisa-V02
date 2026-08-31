import { ProfileRepository } from "@/lib/repositories/profile.repository";
import { NextResponse } from "next/server";
import supabase from "@/app/lib/supabase";
import { sendEmail } from "@/lib/emailService";
import { createStepUnlockedEmail } from "@/lib/emailTemplates";

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

    // Fetch existing profile to detect step status changes
    let oldProfile: any = null;
    try {
      oldProfile = await ProfileRepository.getProfileById(userId);
    } catch (e) {
      // Ignore lookup error
    }

    const data = await ProfileRepository.updateProfile(userId, updates);

    // Trigger Step Unlocked Notification Email if status changed
    if (oldProfile && (oldProfile.email || oldProfile.id)) {
      const targetEmail = oldProfile.email;
      const clientName = `${oldProfile.first_name || ''} ${oldProfile.last_name || ''}`.trim() || "Cliente";

      // Detect step/expediente progression
      let newStepName = "";
      let stepNumber = 0;
      let totalSteps = 4;
      let instructions = "";

      if (updates.expediente_status && updates.expediente_status !== oldProfile.expediente_status) {
        if (updates.expediente_status === 'submitted') {
          newStepName = "Auditoría de Documentos de Soporte";
          stepNumber = 2;
          instructions = "Tus documentos han sido recibidos. Tu asesor consular revisará tu pasaporte, DUI, constancias y estados de cuenta para asegurar cero errores.";
        } else if (updates.expediente_status === 'approved') {
          newStepName = "Llenado Oficial DS-160 y Agendamiento de Citas";
          stepNumber = 3;
          instructions = "¡Tus documentos han sido aprobados! Tu asesor está procesando la planilla consular oficial y agendando tus citas consulares.";
        }
      } else if (updates.appointment_request && updates.appointment_request.status === 'confirmed' && (!oldProfile.appointment_request || oldProfile.appointment_request.status !== 'confirmed')) {
        newStepName = "Simulacro de Entrevista y Cita Consular";
        stepNumber = 4;
        instructions = "¡Tu cita consular y simulacro por Zoom han sido confirmados! Prepárate para practicar las preguntas oficiales con tu asesor.";
      }

      if (newStepName && targetEmail) {
        sendEmail({
          to: targetEmail,
          subject: `🎉 Paso ${stepNumber} Desbloqueado: ${newStepName} - TodoVisa`,
          html: createStepUnlockedEmail(clientName, newStepName, stepNumber, totalSteps, instructions),
        }).catch((e) => console.error("Error sending step unlocked email:", e));
      }
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /api/profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
