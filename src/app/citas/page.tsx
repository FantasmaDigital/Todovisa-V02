"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import supabase from "@/app/lib/supabase";
import { AuthService } from "../service/AuthService";
import { ProfileClientService } from "@/services/client/ProfileClientService";
import { MessageClientService } from "@/app/service/MessageClientService";
import { ROLES } from "../constants/roles";

const OFFICE_LOCATIONS = [
  { id: "zoom", label: "Videollamada por Zoom", address: "Se enviará un enlace de Zoom personalizado a tu correo.", schedule: ["lunes a viernes 9:00‑18:00", "sábado 10:00‑14:00"] },
  { id: "meet", label: "Google Meet", address: "Se enviará un enlace de Google Meet a tu correo.", schedule: ["lunes a viernes 9:00‑18:00", "sábado 10:00‑14:00"] }
];

const VISA_TYPES = [
  "Visa de Turismo",
  "Visa de Estudiante",
  "Visa de Trabajo",
  "Visa de Negocios / Inversión",
  "Residencia Permanente",
  "Renovación de Visa",
  "Otro / No sé aún",
];

const COUNTRIES = [
  "Estados Unidos",
  "Canadá",
  "México",
  "Inglaterra / Reino Unido",
  "Australia",
  "India",
  "Otro",
];

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

type FormData = {
  fullName: string;
  email: string;
  officeId: string;
  visaType: string;
  country: string;
  date: string;
  time: string;
  notes: string;
};

type Errors = Partial<Record<keyof FormData, string>>;

function validate(data: FormData): Errors {
  const errors: Errors = {};
  if (!data.fullName.trim()) errors.fullName = "El nombre es obligatorio.";
  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = "Ingresa un correo electrónico válido.";
  if (!data.officeId) errors.officeId = "Selecciona un canal de asesoría.";
  if (!data.visaType) errors.visaType = "Selecciona el tipo de visa.";
  if (!data.country) errors.country = "Selecciona el país de destino.";
  if (!data.date) errors.date = "Selecciona una fecha.";
  if (!data.time) errors.time = "Selecciona un horario disponible.";
  return errors;
}

const TODAY = new Date().toISOString().split("T")[0];

function CitasPageContent() {
  const headerRef = useRef(null);
  const proposalBannerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const { user, setUser } = useAuthStore();

  // URL Process ID resolution
  const processIdFromUrl = searchParams.get("processId") || searchParams.get("id") || searchParams.get("user_id");
  const targetProcessId = processIdFromUrl || user?.id || null;

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [targetProfileData, setTargetProfileData] = useState<any>(null);

  const [formData, setFormData] = useState<FormData>({
    fullName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "",
    email: user?.email || "",
    officeId: "zoom",
    visaType: "Visa de Turismo",
    country: user?.country || "Estados Unidos",
    date: "",
    time: "10:00",
    notes: "",
  });

  // State to control read-only vs edit mode
  const [isEditing, setIsEditing] = useState<boolean>(true);

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationId, setConfirmationId] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [clientProposalNote, setClientProposalNote] = useState("");

  // Live appointment state from Supabase
  const [appointmentRequest, setAppointmentRequest] = useState<{
    status: 'pending' | 'proposed' | 'confirmed' | 'rejected';
    appointment_type: string;
    requested_date: string;
    requested_time: string;
    client_notes?: string;
    office_id?: string;
    country?: string;
    visa_type?: string;
    agent_proposed_date?: string;
    agent_proposed_time?: string;
    agent_notes?: string;
    meeting_link?: string;
    confirmed_date?: string;
    confirmed_time?: string;
    confirmation_id?: string;
    created_at?: string;
  } | null>(user?.appointmentRequest || null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Validate Process ID and User Authorization
  useEffect(() => {
    const verifyAccessAndLoadData = async () => {
      if (!targetProcessId) {
        setIsAuthorized(false);
        return;
      }

      try {
        const res = await ProfileClientService.getProfile(targetProcessId);
        const prof = res?.profile;

        if (!prof) {
          console.warn("[CitasPage] Target process profile not found:", targetProcessId);
          setIsAuthorized(false);
          return;
        }

        // Authorization check: User must be the owner of the process OR an authorized agent/admin
        const isOwner = user?.id === targetProcessId;
        const isAgentOrAdmin = user?.role === ROLES.AGENT || user?.role === ROLES.ADMIN || user?.role === ROLES.MODERATOR || prof.assigned_agent_id === user?.id;

        if (!isOwner && !isAgentOrAdmin) {
          console.warn("[CitasPage] User unauthorized to access process:", targetProcessId);
          setIsAuthorized(false);
          return;
        }

        setIsAuthorized(true);
        setTargetProfileData(prof);

        // Pre-fill form from profile
        const profName = `${prof.first_name || ""} ${prof.last_name || ""}`.trim();
        const appt = prof.appointment_request || prof.cita_details || prof.document_reviews?.appointment_request || prof.document_reviews?.cita_details;

        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || profName || user?.email || "",
          email: prev.email || prof.email || user?.email || "",
          country: appt?.country || prof.country || prev.country || "Estados Unidos",
          officeId: appt?.office_id || prev.officeId,
          visaType: appt?.visa_type || appt?.appointment_type || prev.visaType,
          date: appt?.requested_date || appt?.confirmed_date || prev.date,
          time: appt?.requested_time || appt?.confirmed_time || prev.time,
          notes: appt?.client_notes || prev.notes,
        }));

        if (appt) {
          setAppointmentRequest(appt);
          setIsEditing(false); // Default to READ-ONLY if appointment already exists!
          if (isOwner && user) {
            setUser({ ...user, appointmentRequest: appt });
          }
          if (appt.confirmation_id) {
            setConfirmationId(appt.confirmation_id);
          }
          // Auto-scroll to proposal banner if agent proposed a new schedule
          if (appt.status === 'proposed') {
            setTimeout(() => {
              proposalBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
          }
        } else {
          setIsEditing(true); // Enable editing for new appointment
        }
      } catch (err) {
        console.error("[CitasPage] Failed to verify access or load profile:", err);
        setIsAuthorized(false);
      }
    };

    verifyAccessAndLoadData();
  }, [targetProcessId, user?.id, user?.role]);

  // Supabase Realtime synchronization for appointment updates
  useEffect(() => {
    if (!targetProcessId) return;

    const channel = supabase
      .channel(`citas-realtime-${targetProcessId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload: any) => {
          const updatedProfile = payload.new;
          if (updatedProfile && updatedProfile.id === targetProcessId) {
            const newAppt = updatedProfile.appointment_request || updatedProfile.cita_details || updatedProfile.document_reviews?.appointment_request || updatedProfile.document_reviews?.cita_details;
            if (newAppt) {
              setAppointmentRequest(newAppt);
              setFormData((prev) => ({
                ...prev,
                officeId: newAppt.office_id || prev.officeId,
                visaType: newAppt.visa_type || newAppt.appointment_type || prev.visaType,
                country: newAppt.country || prev.country,
                date: newAppt.requested_date || newAppt.confirmed_date || prev.date,
                time: newAppt.requested_time || newAppt.confirmed_time || prev.time,
                notes: newAppt.client_notes || prev.notes,
              }));
              if (user && user.id === targetProcessId) {
                setUser({ ...user, appointmentRequest: newAppt });
              }
              if (newAppt.status === 'confirmed') {
                showToast("🎉 ¡La cita ha sido CONFIRMADA por el asesor!", "success");
              } else if (newAppt.status === 'proposed') {
                showToast("📅 El asesor ha propuesto un nuevo horario para la cita.", "info");
                setTimeout(() => {
                  proposalBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetProcessId, user?.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (!isEditing) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;

    const errs = validate(formData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      showToast("Por favor completa los campos requeridos en el formulario.", "error");
      return;
    }
    setIsSubmitting(true);

    const id = appointmentRequest?.confirmation_id || `TV-CITA-${Date.now().toString(36).toUpperCase()}`;
    const selectedOfficeObj = OFFICE_LOCATIONS.find((o) => o.id === formData.officeId);

    const apptData = {
      status: "pending" as const,
      appointment_type: `${formData.visaType} (${selectedOfficeObj?.label || "Virtual"})`,
      requested_date: formData.date,
      requested_time: formData.time,
      client_notes: formData.notes,
      office_id: formData.officeId,
      country: formData.country,
      visa_type: formData.visaType,
      confirmation_id: id,
      created_at: appointmentRequest?.created_at || new Date().toISOString(),
    };

    try {
      setConfirmationId(id);
      setAppointmentRequest(apptData);

      if (targetProcessId) {
        await ProfileClientService.updateProfile(targetProcessId, { appointment_request: apptData });
        if (user && user.id === targetProcessId) {
          setUser({ ...user, appointmentRequest: apptData });
          await AuthService.updateUser({ appointment_request: apptData });
        }

        const msgText = `📅 Solicitud de Cita Actualizada (Proceso: ${targetProcessId.substring(0, 8)}):\n- Canal: ${selectedOfficeObj?.label}\n- Tipo de Visa: ${formData.visaType}\n- País: ${formData.country}\n- Fecha solicitada: ${formData.date}\n- Hora solicitada: ${formData.time} hrs${formData.notes ? `\n- Comentarios: ${formData.notes}` : ""}\n- Folio: ${id}\n\nPor favor confirma este horario o propone una alternativa.`;

        try {
          await MessageClientService.createMessage({
            sender: "user",
            text: msgText,
            user_id: targetProcessId,
            agent_id: targetProfileData?.assigned_agent_id || user?.assignedAgentId || "default-agent",
          });
        } catch (msgErr) {
          console.warn("[CitasPage] Message notification warning:", msgErr);
        }
      }

      setIsEditing(false); // Return to READ-ONLY mode after saving!
      setSubmitted(true);
      showToast("Cita guardada exitosamente. Se ha notificado al asesor.", "success");
    } catch (err: any) {
      console.error("[CitasPage] Failed to save appointment:", err);
      showToast("Error al agendar cita: " + (err.message || String(err)), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptAgentProposal = async () => {
    if (!appointmentRequest || !appointmentRequest.agent_proposed_date || !targetProcessId) return;

    const confirmedReq = {
      ...appointmentRequest,
      status: "confirmed" as const,
      confirmed_date: appointmentRequest.agent_proposed_date,
      confirmed_time: appointmentRequest.agent_proposed_time || "10:00",
    };

    setAppointmentRequest(confirmedReq);

    try {
      await ProfileClientService.updateProfile(targetProcessId, { appointment_request: confirmedReq });
      if (user && user.id === targetProcessId) {
        setUser({ ...user, appointmentRequest: confirmedReq });
        await AuthService.updateUser({ appointment_request: confirmedReq });
      }

      const msgText = `✅ ¡He ACEPTADO la propuesta de cita para el ${confirmedReq.confirmed_date} a las ${confirmedReq.confirmed_time} hrs! Queda confirmada.`;
      await MessageClientService.createMessage({
        sender: "user",
        text: msgText,
        user_id: targetProcessId,
        agent_id: targetProfileData?.assigned_agent_id || user?.assignedAgentId || "",
      });

      showToast("🎉 Cita confirmada exitosamente.", "success");
    } catch (err: any) {
      console.error("Error al aceptar propuesta:", err);
      showToast("Error al confirmar cita: " + (err.message || String(err)), "error");
    }
  };

  const handleRejectAgentProposal = async () => {
    if (!appointmentRequest || !targetProcessId) return;
    const rejectedReq = {
      ...appointmentRequest,
      status: "rejected" as const,
      agent_notes: clientProposalNote || appointmentRequest.agent_notes || "",
      client_rejection_note: clientProposalNote || "",
    };
    setAppointmentRequest(rejectedReq);
    try {
      await ProfileClientService.updateProfile(targetProcessId, { appointment_request: rejectedReq });
      if (user && user.id === targetProcessId) {
        setUser({ ...user, appointmentRequest: rejectedReq });
        await AuthService.updateUser({ appointment_request: rejectedReq });
      }
      const msgText = `❌ He RECHAZADO la propuesta de horario del asesor.${clientProposalNote ? `\n\n💬 Mi observación: "${clientProposalNote}"` : ""} Por favor proponga un nuevo horario alternativo.`;
      await MessageClientService.createMessage({
        sender: "user",
        text: msgText,
        user_id: targetProcessId,
        agent_id: targetProfileData?.assigned_agent_id || user?.assignedAgentId || "",
      });
      setClientProposalNote("");
      showToast("Propuesta rechazada. Se notificó al asesor.", "info");
    } catch (err: any) {
      console.error("Error al rechazar propuesta:", err);
      showToast("Error: " + (err.message || String(err)), "error");
    }
  };

  const selectedOffice = OFFICE_LOCATIONS.find((o) => o.id === formData.officeId);

  // Render Authorization Restriction screen if invalid processId or unauthorized
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-background-main">
        <Header headerRef={headerRef} />
        <main className="w-full max-w-xl mx-auto px-4 py-16 flex-1 flex flex-col items-center justify-center text-center">
          <div className="bg-white border border-red-200 rounded-3xl p-8 shadow-xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto border border-red-100">
              🔒
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-serif mb-2">Acceso Restringido al Trámite</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                El agendamiento de citas está disponible únicamente para clientes con un proceso consular activo en su cuenta. No tienes permisos para consultar o modificar este expediente.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/profile"
                className="px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-md transition-all no-underline"
              >
                👤 Ir a Mi Panel de Usuario
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background-main">
      <Header headerRef={headerRef} />

      {/* ── Hero Banner ── */}
      <div className="w-full bg-brand-primary py-10 md:py-12 px-4 sm:px-6 relative overflow-hidden" id="cita-virtual">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-2">
                Trámite ID: {targetProcessId ? targetProcessId.substring(0, 8) : "Activo"} • Asesoría Virtual
              </p>
              <h1 className="text-3xl md:text-5xl text-white leading-tight mb-2 font-semibold font-serif italic">
                Agenda tu asesoría virtual
              </h1>
              <p className="text-white/95 text-sm md:text-base max-w-2xl leading-relaxed">
                Conéctate de forma remota por Zoom o Meet. Coordinamos tus horarios y entrenamiento para la entrevista en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex-1 space-y-8">

        {/* ── Proposed or Confirmed Banner (only displayed for proposed or confirmed status) ── */}
        {appointmentRequest && (appointmentRequest.status === 'confirmed' || appointmentRequest.status === 'proposed' || appointmentRequest.status === 'rejected') && (
          <div ref={proposalBannerRef}>
          <div className="animate-in fade-in zoom-in-95 duration-200">
            {appointmentRequest.status === 'confirmed' ? (
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl">🎉</div>
                    <div>
                      <h3 className="text-base font-extrabold text-emerald-950">¡Cita Consular / Asesoría Confirmada!</h3>
                      <p className="text-xs text-emerald-800">Folio de confirmación: <strong className="font-mono">{appointmentRequest.confirmation_id || confirmationId || 'TV-CONFIRMED'}</strong></p>
                    </div>
                  </div>
                  <span className="bg-emerald-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-xs">
                    CONFIRMADA
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-white p-4 rounded-xl border border-emerald-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Trámite</span>
                    <span className="font-semibold text-slate-800 block mt-0.5">{appointmentRequest.appointment_type}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Fecha Confirmada</span>
                    <span className="font-bold text-emerald-700 text-sm block mt-0.5">{appointmentRequest.confirmed_date || appointmentRequest.requested_date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Hora Confirmada</span>
                    <span className="font-bold text-emerald-700 text-sm block mt-0.5">{appointmentRequest.confirmed_time || appointmentRequest.requested_time} hrs</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Canal</span>
                    <span className="font-semibold text-slate-800 block mt-0.5">{appointmentRequest.office_id === 'meet' ? '📹 Google Meet' : '🎥 Zoom'}</span>
                  </div>
                </div>

                {/* Enlace de Reunión Zoom / Meet */}
                {appointmentRequest.meeting_link ? (
                  <div className="p-4 bg-white border border-emerald-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider block">
                        🎥 Enlace de Reunión Virtual (Zoom / Google Meet)
                      </span>
                      <span className="text-xs text-emerald-700 font-mono font-bold block truncate max-w-sm mt-0.5">
                        {appointmentRequest.meeting_link}
                      </span>
                    </div>
                    <a
                      href={appointmentRequest.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 no-underline"
                    >
                      <span>🎥 Unirse a la Reunión →</span>
                    </a>
                  </div>
                ) : (
                  appointmentRequest.agent_notes && (
                    <p className="text-xs text-emerald-950 italic bg-white p-3 rounded-xl border border-emerald-200">
                      💬 Nota del Asesor: &quot;{appointmentRequest.agent_notes}&quot;
                    </p>
                  )
                )}
              </div>
            ) : appointmentRequest.status === 'proposed' ? (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xl">📅</div>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-950">El Asesor propone un Nuevo Horario</h3>
                      <p className="text-xs text-amber-800">Revisa la alternativa sugerida por el asesor para confirmar la cita.</p>
                    </div>
                  </div>
                  <span className="bg-amber-500 text-white text-xs font-extrabold px-3 py-1 rounded-full animate-pulse shadow-xs">
                    NUEVA PROPUESTA
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-xl border border-amber-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Fecha Propuesta por Asesor</span>
                    <span className="font-extrabold text-amber-800 text-base block mt-0.5">{appointmentRequest.agent_proposed_date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Hora Propuesta por Asesor</span>
                    <span className="font-extrabold text-amber-800 text-base block mt-0.5">{appointmentRequest.agent_proposed_time}</span>
                  </div>
                </div>
                {appointmentRequest.agent_notes && (
                  <p className="text-xs text-amber-900 italic bg-white p-3 rounded-xl border border-amber-200">
                    💬 Nota del Asesor: &quot;{appointmentRequest.agent_notes}&quot;
                  </p>
                )}
                {/* Client note input for rejection */}
                <div>
                  <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1.5">
                    Tu Comentario / Observación (opcional)
                  </label>
                  <input
                    type="text"
                    value={clientProposalNote}
                    onChange={(e) => setClientProposalNote(e.target.value)}
                    placeholder="Ej. No puedo esa fecha, prefiero viernes por la tarde..."
                    className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>
                <div className="flex gap-3 flex-wrap pt-1">
                  <button
                    type="button"
                    onClick={handleAcceptAgentProposal}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>✅</span>
                    <span>Aceptar Horario Propuesto</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectAgentProposal}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>❌</span>
                    <span>Rechazar / Observar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📅</span>
                    <span>Proponer Otro Horario</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center text-xl">❌</div>
                    <div>
                      <h3 className="text-base font-extrabold text-red-950">Solicitud de Cita Rechazada</h3>
                      <p className="text-xs text-red-800">Tu asesor ha revisado la solicitud y dejado una observación.</p>
                    </div>
                  </div>
                  <span className="bg-red-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-xs">
                    RECHAZADA
                  </span>
                </div>
                {appointmentRequest.agent_notes && (
                  <p className="text-xs text-red-900 bg-white p-3 rounded-xl border border-red-200">
                    💬 Motivo del Asesor: &quot;{appointmentRequest.agent_notes}&quot;
                  </p>
                )}
              </div>
            )}
          </div>
          </div>
        )}

        {(!submitted || appointmentRequest?.status === 'proposed') ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-10">

            {/* ── Left: Info cards ── */}
            <aside className="lg:col-span-2 flex flex-col gap-5">

              {/* What to expect */}
              <div className="bg-white border border-border-light rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">
                  ¿Qué incluye la cita?
                </h2>
                <ul className="space-y-4">
                  {[
                    { icon: "🎯", title: "Diagnóstico de perfil", desc: "Evaluamos tu situación migratoria actual." },
                    { icon: "📋", title: "Revisión documental", desc: "Checklist personalizado según tu visa objetivo." },
                    { icon: "💬", title: "Asesoría sin compromiso", desc: "60 min con un experto certificado TodoVisa." },
                    { icon: "🗺️", title: "Plan de acción", desc: "Hoja de ruta con fechas y pasos concretos." },
                  ].map((item) => (
                    <li key={item.title} className="flex gap-3 items-start">
                      <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-text-primary">{item.title}</p>
                        <p className="text-[11px] text-text-secondary leading-relaxed mt-0.5">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Virtual Channels */}
              <div className="bg-white border border-border-light rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">
                  Canales de Asesoría Virtual
                </h2>
                <ul className="space-y-3">
                  {OFFICE_LOCATIONS.map((o) => (
                    <li key={o.id} className="flex gap-2.5 items-start">
                      <svg className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-xs font-bold text-text-primary leading-snug">{o.label}</p>
                        <p className="text-[11px] text-text-secondary leading-relaxed mt-0.5">{o.address}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Note */}
              <div className="bg-brand-light border border-brand-primary/20 rounded-2xl p-4 flex gap-3 items-start">
                <svg className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Trámite auditado para el expediente ID <strong className="text-text-primary">{targetProcessId?.substring(0, 8)}</strong> con sincronización en tiempo real.
                </p>
              </div>
            </aside>

            {/* ── Right: Form (Read-Only until user clicks Modificar) ── */}
            <section className="lg:col-span-3">
              <div className="bg-white border border-border-light rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
                {/* Form header */}
                <div className="px-6 md:px-8 py-5 border-b border-border-light flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-text-primary">Datos de la Cita</h2>
                      {appointmentRequest && (
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          appointmentRequest.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          appointmentRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          appointmentRequest.status === 'proposed' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {appointmentRequest.status === 'confirmed' ? '✓ CONFIRMADA' :
                           appointmentRequest.status === 'rejected' ? '✕ RECHAZADA' :
                           appointmentRequest.status === 'proposed' ? '⚡ PROPUESTA' : '⏳ EN ESPERA DE ASESOR'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {appointmentRequest?.status === 'confirmed'
                        ? "Tu cita ha sido confirmada por el asesor y no puede ser modificada."
                        : isEditing
                          ? "Edita los campos y presiona Guardar Cambios para actualizar tu solicitud."
                          : "Los datos de tu cita se encuentran registrados. Haz clic en 'Modificar Cita' si deseas realizar cambios."}
                    </p>
                  </div>

                  {/* Header Edit / Read-only Button */}
                  {appointmentRequest && (
                    appointmentRequest.status === 'confirmed' ? (
                      <span className="px-3.5 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 shrink-0 flex items-center gap-1.5">
                        <span>🔒</span>
                        <span>Confirmada (No Modificable)</span>
                      </span>
                    ) : !isEditing ? (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <span>✏️</span>
                        <span>Modificar Cita</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
                      >
                        Cancelar Edición
                      </button>
                    )
                  )}
                </div>

                <form onSubmit={handleSubmit} noValidate className="px-6 md:px-8 py-7 space-y-5">

                  {/* Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="fullName" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        disabled={!isEditing}
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Ej. Juan Pérez García"
                        className="w-full px-3.5 py-2 border border-border-light rounded-xl text-sm text-text-primary bg-background-main disabled:bg-slate-100 disabled:text-slate-700 disabled:border-slate-200 disabled:cursor-not-allowed font-medium focus:border-brand-primary focus:outline-none transition-all"
                      />
                      {errors.fullName && <p className="text-xs text-status-error mt-1">{errors.fullName}</p>}
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        disabled={!isEditing}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="juan@email.com"
                        className="w-full px-3.5 py-2 border border-border-light rounded-xl text-sm text-text-primary bg-background-main disabled:bg-slate-100 disabled:text-slate-700 disabled:border-slate-200 disabled:cursor-not-allowed font-medium focus:border-brand-primary focus:outline-none transition-all"
                      />
                      {errors.email && <p className="text-xs text-status-error mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <hr className="border-border-light" />

                  {/* Office (Virtual Channel) */}
                  <div>
                    <label htmlFor="officeId" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                      Canal de asesoría virtual
                    </label>
                    <select
                      id="officeId"
                      name="officeId"
                      disabled={!isEditing}
                      value={formData.officeId}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 border border-border-light rounded-xl text-sm text-text-primary bg-background-main disabled:bg-slate-100 disabled:text-slate-700 disabled:border-slate-200 disabled:cursor-not-allowed font-medium focus:border-brand-primary focus:outline-none transition-all cursor-pointer"
                    >
                      {OFFICE_LOCATIONS.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                    {selectedOffice && (
                      <p className="text-[11px] text-text-secondary mt-1.5 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-brand-primary flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {selectedOffice.address}
                      </p>
                    )}
                    {errors.officeId && <p className="text-xs text-status-error mt-1">{errors.officeId}</p>}
                  </div>

                  {/* Visa type + Country */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="visaType" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                        Tipo de visa
                      </label>
                      <select
                        id="visaType"
                        name="visaType"
                        disabled={!isEditing}
                        value={formData.visaType}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 border border-border-light rounded-xl text-sm text-text-primary bg-background-main disabled:bg-slate-100 disabled:text-slate-700 disabled:border-slate-200 disabled:cursor-not-allowed font-medium focus:border-brand-primary focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="">Selecciona una opción</option>
                        {VISA_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                      {errors.visaType && <p className="text-xs text-status-error mt-1">{errors.visaType}</p>}
                    </div>
                    <div>
                      <label htmlFor="country" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                        País de destino
                      </label>
                      <select
                        id="country"
                        name="country"
                        disabled={!isEditing}
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 border border-border-light rounded-xl text-sm text-text-primary bg-background-main disabled:bg-slate-100 disabled:text-slate-700 disabled:border-slate-200 disabled:cursor-not-allowed font-medium focus:border-brand-primary focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="">Selecciona un país</option>
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {errors.country && <p className="text-xs text-status-error mt-1">{errors.country}</p>}
                    </div>
                  </div>

                  <hr className="border-border-light" />

                  {/* Date + Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="date" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                        Fecha preferida
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        disabled={!isEditing}
                        value={formData.date}
                        min={TODAY}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 border border-border-light rounded-xl text-sm text-text-primary bg-background-main disabled:bg-slate-100 disabled:text-slate-700 disabled:border-slate-200 disabled:cursor-not-allowed font-medium focus:border-brand-primary focus:outline-none transition-all cursor-pointer"
                      />
                      {errors.date && <p className="text-xs text-status-error mt-1">{errors.date}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                        Horario disponible
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {TIME_SLOTS.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            disabled={!isEditing}
                            onClick={() => {
                              if (!isEditing) return;
                              setFormData((prev) => ({ ...prev, time: slot }));
                              if (errors.time) setErrors((prev) => ({ ...prev, time: undefined }));
                            }}
                            className={`px-2 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                              formData.time === slot
                                ? "bg-brand-primary text-white border-brand-primary shadow-xs"
                                : "bg-background-main text-text-secondary border-border-light"
                            } ${!isEditing ? "opacity-75 cursor-not-allowed" : "cursor-pointer hover:border-brand-primary/50"}`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                      {errors.time && <p className="text-xs text-status-error mt-1.5">{errors.time}</p>}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                      Comentarios adicionales <span className="font-normal text-text-muted normal-case">(opcional)</span>
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      disabled={!isEditing}
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Cuéntanos brevemente tu situación o cualquier duda específica..."
                      className="w-full px-3.5 py-2 border border-border-light rounded-xl text-sm text-text-primary bg-background-main disabled:bg-slate-100 disabled:text-slate-700 disabled:border-slate-200 disabled:cursor-not-allowed font-medium focus:border-brand-primary focus:outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2">
                    {isEditing ? (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 px-8 py-3.5 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-brand-hover transition-all focus:outline-none flex items-center justify-center gap-2 shadow-md disabled:opacity-50 cursor-pointer border-0"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Guardando cambios...
                            </>
                          ) : (
                            <>
                              <span>💾</span>
                              <span>Guardar Cambios de la Cita</span>
                            </>
                          )}
                        </button>
                        {appointmentRequest && (
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-5 py-3.5 border border-border-light text-text-secondary text-sm font-bold rounded-xl hover:bg-background-hover transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    ) : appointmentRequest?.status === 'confirmed' ? (
                      <button
                        type="button"
                        disabled={true}
                        className="w-full px-8 py-3.5 bg-slate-200 text-slate-500 text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border-none opacity-90 shadow-none"
                      >
                        <span>🔒</span>
                        <span>Cita Confirmada por el Asesor (No Modificable)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="w-full px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer border-0"
                      >
                        <span>✏️</span>
                        <span>Modificar Cita</span>
                      </button>
                    )}
                    <p className="text-center text-[11px] text-text-muted mt-3">
                      Al agendar o modificar, la solicitud queda sincronizada con el expediente {targetProcessId?.substring(0, 8)}.
                    </p>
                  </div>
                </form>
              </div>
            </section>
          </div>
        ) : (
          /* ── Success Screen ── */
          <div className="bg-white border border-border-light shadow-md rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-300 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-text-primary mb-2 font-serif">¡Asesoría agendada / modificada con éxito!</h1>
            <p className="text-sm text-text-secondary max-w-sm mx-auto mb-8 leading-relaxed">
              Registramos los cambios para el proceso <strong className="font-mono">{targetProcessId?.substring(0, 8)}</strong> en Supabase.
            </p>

            {/* Receipt */}
            <div className="bg-background-main border border-border-light rounded-xl p-6 text-left space-y-3 mb-8 shadow-inner">
              <div className="flex justify-between border-b border-border-light pb-2.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Folio de Cita</span>
                <span className="text-xs font-bold text-brand-primary font-mono">{confirmationId}</span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-2.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Cliente</span>
                <span className="text-xs font-semibold text-text-primary">{formData.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-2.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Canal de Asesoría</span>
                <span className="text-xs font-semibold text-text-primary">{selectedOffice?.label}</span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-2.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Fecha y Hora Solicitadas</span>
                <span className="text-xs font-semibold text-text-primary">{formData.date} — {formData.time} hrs</span>
              </div>
              <div className="flex justify-between border-b border-border-light pb-2.5">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Tipo de Visa</span>
                <span className="text-xs font-semibold text-text-primary">{formData.visaType} ({formData.country})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-bold text-text-secondary uppercase">Estado</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  ⏳ En espera de Asesor
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setIsEditing(false);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-hover transition-all text-center shadow-sm cursor-pointer border-0"
              >
                📋 Ver Resumen de Cita
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setIsEditing(true);
                }}
                className="w-full sm:w-auto px-6 py-3 border border-border-light text-text-secondary text-xs font-bold rounded-xl hover:bg-background-hover transition-colors cursor-pointer"
              >
                ✏️ Modificar nuevamente
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[400] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border animate-in slide-in-from-bottom-4 duration-300 max-w-sm ${
          toast.type === 'success'
            ? 'bg-white border-emerald-200 text-emerald-900'
            : toast.type === 'error'
              ? 'bg-white border-red-200 text-red-900'
              : 'bg-white border-blue-200 text-blue-900'
        }`}>
          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm ${
            toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : toast.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'i'}
          </div>
          <p className="text-xs font-semibold leading-snug flex-1">{toast.message}</p>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function CitasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-background-main">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CitasPageContent />
    </Suspense>
  );
}
