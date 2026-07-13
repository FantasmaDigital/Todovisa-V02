"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "../../components/shared/Header";
import { Footer } from "../../components/shared/Footer";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabase";
import { ROLES } from "../../constants/roles";

interface AgentApplication {
  id: string;
  application_id: string;
  full_name: string;
  email: string;
  phone: string;
  country_residence: string;
  experience_years: string;
  status: 'pending' | 'approved' | 'active' | 'rejected';
  signature_name?: string | null;
  signed_at?: string | null;
  created_at: string;
  documents: {
    dui?: string | null;
    certificacion?: string | null;
    antecedentes?: string | null;
    domicilio?: string | null;
    titulo?: string | null;
    cv?: string | null;
  };
}

export default function AcreditacionPage() {
  const headerRef = useRef(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  // States
  const [agent, setAgent] = useState<AgentApplication | null>(null);
  const [myAgency, setMyAgency] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signatureName, setSignatureName] = useState("");
  const [signing, setSigning] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch agent application or agency backing
  const loadAgentApplication = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let agencyId = null;
      if (user.role === "agent") {
        const { data: memberData, error: memberErr } = await supabase
          .from("agency_members")
          .select("agency_id")
          .eq("member_id", user.id)
          .maybeSingle();

        if (memberErr) {
          console.error("Error loading agency membership:", memberErr.message);
        } else if (memberData && memberData.agency_id) {
          agencyId = memberData.agency_id;
          const { data: agencyProfile, error: agencyErr } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, email, photo_url, phone, bio, location, staff_size")
            .eq("id", agencyId)
            .maybeSingle();

          if (agencyProfile) {
            setMyAgency({ ...agencyProfile, joined_at: null });
          }
        }
      }

      const targetUserId = agencyId || user.id;

      // Fetch agent application (direct or agency's)
      const { data, error } = await supabase
        .from("agent_applications")
        .select("*")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (error) throw error;
      setAgent(data || null);
    } catch (err) {
      console.error("Error loading agent application or agency info:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted && user) {
      if (user.role !== ROLES.AGENT && user.role !== ROLES.AGENCY) {
        router.push("/profile");
        return;
      }
      loadAgentApplication();
    }
  }, [isMounted, user?.id, user?.role]);

  // Handle commercial agreement digital signature
  const handleSignAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;
    if (!signatureName.trim()) {
      showToast("Por favor escribe tu nombre completo para firmar.", "error");
      return;
    }

    setSigning(true);
    const nowString = new Date().toISOString();
    try {
      const { error: updateErr } = await supabase
        .from("agent_applications")
        .update({
          status: "active",
          signature_name: signatureName.trim(),
          signed_at: nowString
        })
        .eq("id", agent.id);

      if (updateErr) throw updateErr;

      // Update user role if needed
      await supabase.auth.refreshSession();

      setAgent((prev) =>
        prev
          ? {
              ...prev,
              status: "active",
              signature_name: signatureName.trim(),
              signed_at: nowString
            }
          : null
      );
      showToast("¡Contrato firmado con éxito! Tu acreditación se encuentra activa.", "success");
    } catch (err: unknown) {
      console.error("Error signing agreement:", err);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg || "Error al firmar acuerdo comercial.", "error");
    } finally {
      setSigning(false);
    }
  };

  if (!isMounted || !user) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-background-main">
        <Header headerRef={headerRef} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background-main">
      <Header headerRef={headerRef} />

      <main className="w-[80%] mx-auto py-10 flex-grow text-left">
        {/* Back navigation */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/profile?tab=portal_agente")}
            className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent"
          >
            &larr; Volver al Panel
          </button>
        </div>

        <div className="mb-8 pb-4 border-b border-border-light">
          <h1 className="text-2xl font-bold text-text-primary">Mi Acreditación Red TodoVisa</h1>
          <p className="text-xs text-text-secondary mt-1">Revisa el estado de tu postulación, documentos presentados y firma del acuerdo de adhesión comercial.</p>
        </div>

        {loading ? (
          <p className="text-xs text-text-muted">Cargando acreditación...</p>
                ) : !agent ? (
          <div className="border border-border-light rounded-sm p-8 bg-white text-center">
            <p className="text-sm text-text-secondary italic">No se ha encontrado ninguna solicitud de acreditación vinculada a esta cuenta.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {myAgency && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-205 rounded-sm p-4 text-xs text-blue-900 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <p className="font-bold text-sm">Acreditación por Respaldo Corporativo</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">Estás acreditado en la red TodoVisa bajo la fianza y el registro comercial de la agencia <strong>{myAgency.first_name} {myAgency.last_name}</strong>.</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-300 self-start sm:self-center">
                  VÍNCULO ACTIVO
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Main Application Status details */}
              <div className="lg:col-span-2 space-y-6">
                {/* STATUS CARD */}
                <div className="border border-border-light rounded-sm p-6 bg-white space-y-4">
                  <div className="flex justify-between items-center border-b border-border-light pb-3">
                    <div>
                      <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Folio de Postulación</span>
                      <h3 className="text-base font-mono font-bold text-text-primary mt-0.5">{agent.application_id}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase ${
                      agent.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : agent.status === "approved"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : agent.status === "rejected"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {agent.status === "active"
                        ? "ACTIVA"
                        : agent.status === "approved"
                        ? "APROBADA"
                        : agent.status === "rejected"
                        ? "RECHAZADA"
                        : "PENDIENTE DE REVISIÓN"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-left">
                    <div>
                      <span className="text-text-secondary">Nombre de Solicitante:</span>
                      <p className="font-bold text-text-primary mt-0.5">{agent.full_name}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Fecha de Postulación:</span>
                      <p className="font-bold text-text-primary mt-0.5">{new Date(agent.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Correo Electrónico:</span>
                      <p className="font-bold text-text-primary mt-0.5">{agent.email}</p>
                    </div>
                    <div>
                      <span className="text-text-secondary">Teléfono de Contacto:</span>
                      <p className="font-bold text-text-primary mt-0.5">{agent.phone}</p>
                    </div>
                  </div>
                </div>

                {/* AGREEMENT DIGITAL SIGNATURE FLOW */}
                {agent.status === "approved" && (
                  <div className="border border-brand-primary/25 rounded-sm p-6 bg-brand-light/30 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider mb-1">Acuerdo de Adhesión Comercial</h3>
                      <p className="text-xs text-text-secondary">Tu solicitud fue aprobada. Lee y firma digitalmente el acuerdo comercial para activar tu cuenta.</p>
                    </div>

                    <div className="bg-white border border-border-light rounded-sm p-4 text-[10px] text-text-primary space-y-3 font-serif max-h-60 overflow-y-auto leading-relaxed shadow-inner">
                      <p className="font-bold text-center text-xs">CONTRATO DE ADHESIÓN A LA RED DE AGENTES TODOVISA</p>
                      <p>Entre TodoVisa (en adelante "La Plataforma") y el solicitante firmante (en adelante "El Asesor"), acuerdan lo siguiente:</p>
                      <p><strong>1. OBJETO:</strong> El Asesor se adhiere a la red digital para asesorar clientes en la preparación de expedientes de visas consulares.</p>
                      <p><strong>2. COMISIONES:</strong> La Plataforma liquidará las comisiones según el plan financiero seleccionado de manera semanal cada viernes, deduciendo un 5% por tarifa de uso tecnológico.</p>
                      <p><strong>3. CONFIDENCIALIDAD:</strong> El Asesor se obliga a tratar los datos personales y documentos provistos por los clientes bajo absoluta reserva.</p>
                    </div>

                    {user.role !== ROLES.AGENT && (
                      <form onSubmit={handleSignAgreement} className="space-y-4 pt-2">
                        <div>
                          <label className="block text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1">Nombre Completo para Firma Digital</label>
                          <input
                            type="text"
                            required
                            value={signatureName}
                            onChange={(e) => setSignatureName(e.target.value)}
                            placeholder="Escribe tu nombre y apellidos exactamente como aparecen en tu documento"
                            className="w-full px-3 py-2 bg-white border border-border-light rounded-sm text-xs focus:border-brand-primary focus:outline-none transition-all text-text-primary"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={signing}
                          className="px-5 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-colors shadow-sm cursor-pointer border-none"
                        >
                          {signing ? "Firmando..." : "Firmar Acuerdo Comercial"}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* SIGNED CONTRACT SUMMARY */}
                {agent.status === "active" && (
                  <div className="border border-emerald-250 rounded-sm p-6 bg-emerald-50/30 space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-1">Acuerdo Comercial Firmado</h3>
                      <p className="text-xs text-emerald-700">Tu cuenta está totalmente certificada y operativa en la red.</p>
                    </div>
                    <div className="bg-white border border-emerald-200 rounded-sm p-4 text-[10px] text-text-secondary flex flex-col gap-2 font-mono">
                      <span className="font-bold text-emerald-800">✓ CONTRATO FIRMADO DIGITALMENTE POR: {agent.signature_name}</span>
                      <span>FECHA DE FIRMA: {agent.signed_at ? new Date(agent.signed_at).toLocaleString() : ""}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submitted Documentation / Agency side card */}
              <div className="lg:col-span-1 space-y-6">
                {myAgency && (
                  <div className="border border-border-light rounded-sm p-6 bg-white space-y-4 shadow-sm text-left">
                    <div>
                      <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-1">Información de la Agencia</h3>
                      <p className="text-xs text-text-secondary">Datos de la empresa asociada que te respalda.</p>
                    </div>

                    <div className="flex flex-col items-center text-center p-4 bg-gray-55 rounded-lg border border-gray-100 gap-3">
                      <img
                        src={myAgency.photo_url || myAgency.avatar_url || `https://unavatar.io/${encodeURIComponent(myAgency.email?.trim().toLowerCase() || "")}?fallback=https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(myAgency.first_name || "Agency")}`}
                        alt={`${myAgency.first_name} ${myAgency.last_name}`}
                        className="w-16 h-16 rounded-xl object-cover shadow border border-blue-200"
                      />
                      <div>
                        <h4 className="font-serif font-bold text-text-primary text-base leading-tight">
                          {myAgency.first_name} {myAgency.last_name}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-3.5 text-xs text-text-primary">
                      {myAgency.bio && (
                        <div className="border-b border-border-light pb-3">
                          <span className="font-semibold uppercase text-[9px] text-text-secondary block mb-1">Bio</span>
                          <p className="text-[11px] text-text-secondary leading-relaxed">{myAgency.bio}</p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-text-secondary font-semibold">Correo:</span>
                          <span className="text-text-primary font-mono">{myAgency.email}</span>
                        </div>
                        {myAgency.phone && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-text-secondary font-semibold">Teléfono:</span>
                            <span className="text-text-primary font-mono">{myAgency.phone}</span>
                          </div>
                        )}
                        {myAgency.location && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-text-secondary font-semibold">Ubicación:</span>
                            <span className="text-text-primary font-mono">{myAgency.location}</span>
                          </div>
                        )}
                        {myAgency.staff_size && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-text-secondary font-semibold">Staff:</span>
                            <span className="text-text-primary">{myAgency.staff_size} asesores</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="border border-border-light rounded-sm p-6 bg-white space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-1">Documentos Presentados</h3>
                    <p className="text-xs text-text-secondary">Expediente de acreditación adjunto al folio.</p>
                  </div>

                  <div className="space-y-3.5 text-xs text-text-primary">
                    {agent.documents && Object.entries(agent.documents).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center border-b border-border-light pb-2">
                        <span className="font-semibold uppercase text-[10px] text-text-secondary">{key}</span>
                        {val ? (
                          <span className="text-[10px] text-emerald-600 font-bold">Cargado ✓</span>
                        ) : (
                          <span className="text-[10px] text-text-muted">No presentado</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Toast Alert Component */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-sm border shadow-xl animate-in slide-in-from-bottom-5 duration-300 bg-white ${
          toast.type === 'success' 
            ? 'border-emerald-250 text-emerald-800 bg-emerald-50/50' 
            : toast.type === 'error' 
            ? 'border-red-250 text-red-800 bg-red-50/50' 
            : 'border-blue-250 text-blue-800 bg-blue-50/50'
        }`}>
          <span className="text-base select-none">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="text-xs font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-text-muted hover:text-text-primary font-bold focus:outline-none cursor-pointer border-none bg-transparent">✕</button>
        </div>
      )}
    </div>
  );
}
