"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "../../components/shared/Header";
import { Footer } from "../../components/shared/Footer";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabase";
import { ROLES } from "../../constants/roles";

interface AgencyMember {
  id: string;
  agency_id: string;
  member_id: string;
  member_role: string;
  created_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface AgencyInvitation {
  id: string;
  agency_id: string;
  email: string;
  token: string;
  expires_at: string;
  status: "pending" | "accepted" | "expired";
  created_at: string;
}

export default function MiEquipoPage() {
  const headerRef = useRef(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  // States
  const [agencyMembers, setAgencyMembers] = useState<AgencyMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [agencyInvitations, setAgencyInvitations] = useState<AgencyInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);

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

  // Fetch agency team members
  const loadAgencyMembers = async () => {
    if (!user || user.role !== ROLES.AGENCY) return;
    setIsLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from("agency_members")
        .select("*, profile:member_id(first_name, last_name, email)")
        .eq("agency_id", user.id);
      if (error) throw error;
      setAgencyMembers(data || []);
    } catch (err) {
      console.error("Error fetching agency members:", err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Fetch agency invitations
  const loadAgencyInvitations = async () => {
    if (!user || user.role !== ROLES.AGENCY) return;
    setIsLoadingInvitations(true);
    try {
      const { data, error } = await supabase
        .from("agency_invitations")
        .select("*")
        .eq("agency_id", user.id);
      if (error) throw error;
      setAgencyInvitations(data || []);
    } catch (err) {
      console.error("Error fetching agency invitations:", err);
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  useEffect(() => {
    if (isMounted && user) {
      if (user.role !== ROLES.AGENCY) {
        router.push("/profile");
        return;
      }
      loadAgencyMembers();
      loadAgencyInvitations();
    }
  }, [isMounted, user?.id]);

  // Invite consultant
  const handleInviteConsultant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== ROLES.AGENCY) return;
    if (!inviteEmail.trim()) {
      showToast("Ingresa un correo válido", "error");
      return;
    }

    setIsSendingInvite(true);
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

      const { error } = await supabase
        .from("agency_invitations")
        .insert({
          agency_id: user.id,
          email: inviteEmail.trim().toLowerCase(),
          token,
          expires_at: expiresAt.toISOString(),
          status: "pending"
        });

      if (error) throw error;

      showToast(`Invitación generada para ${inviteEmail.trim()}`, "success");
      setInviteEmail("");
      loadAgencyInvitations();
    } catch (err: unknown) {
      console.error("Error inviting consultant:", err);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg || "Error al generar invitación.", "error");
    } finally {
      setIsSendingInvite(false);
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

      <main className="w-[80%] mx-auto py-10 flex-grow">
        {/* Back navigation */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/profile?tab=portal_agente")}
            className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent"
          >
            &larr; Volver al Panel
          </button>
        </div>

        <div className="mb-8 pb-4 border-b border-border-light text-left">
          <h1 className="text-2xl font-bold text-text-primary">Mi Equipo de Asesores</h1>
          <p className="text-xs text-text-secondary mt-1">Gestiona los asesores miembros de tu empresa e invita a nuevos agentes a unirse.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left items-start">
          {/* Members List */}
          <div className="lg:col-span-2 border border-border-light rounded-sm p-6 bg-white space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-1">Miembros del Equipo</h3>
              <p className="text-xs text-text-secondary">Asesores autorizados bajo la acreditación de tu agencia.</p>
            </div>

            {isLoadingMembers ? (
              <p className="text-xs text-text-muted">Cargando equipo...</p>
            ) : agencyMembers.length === 0 ? (
              <p className="text-xs text-text-muted italic">Aún no tienes consultores registrados.</p>
            ) : (
              <div className="space-y-3">
                {agencyMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3.5 border border-border-light rounded-sm bg-background-main hover:border-brand-primary/20 transition-all duration-150">
                    <div>
                      <div className="text-xs font-bold text-text-primary">
                        {m.profile ? `${m.profile.first_name} ${m.profile.last_name}` : "Asesor TodoVisa"}
                      </div>
                      <div className="text-[10px] text-text-secondary">{m.profile?.email || ""}</div>
                    </div>
                    <span className="px-2.5 py-1 bg-brand-light border border-border-light text-brand-primary text-[9px] font-bold uppercase rounded-sm">
                      {m.member_role === "supervisor" ? "Supervisor" : "Asesor"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invitation block */}
          <div className="lg:col-span-1 space-y-6">
            <div className="border border-border-light rounded-sm p-6 bg-white space-y-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-1">Invitar Asesor</h3>
                <p className="text-xs text-text-secondary">Genera invitaciones para que consultores se vinculen a tu agencia.</p>
              </div>

              <form onSubmit={handleInviteConsultant} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] text-text-secondary font-bold uppercase tracking-wider mb-1.5">Correo del Consultor</label>
                  <input
                    type="email"
                    required
                    placeholder="consultor@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-xs focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:outline-none transition-all text-text-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSendingInvite}
                  className="w-full py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-colors shadow-sm cursor-pointer border-none"
                >
                  {isSendingInvite ? "Generando..." : "Enviar Invitación"}
                </button>
              </form>

              {/* Pending Invitations list */}
              <div className="pt-4 border-t border-border-light mt-4">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-3">Invitaciones Enviadas</h4>
                {isLoadingInvitations ? (
                  <p className="text-[10px] text-text-muted">Cargando invitaciones...</p>
                ) : agencyInvitations.length === 0 ? (
                  <p className="text-[10px] text-text-muted italic">No hay invitaciones registradas.</p>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {agencyInvitations.map((inv) => (
                      <div key={inv.id} className="p-3 border border-border-light rounded-sm bg-background-main text-[10px] flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-text-primary truncate mr-1.5">{inv.email}</span>
                          <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold ${
                            inv.status === "accepted"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : inv.status === "expired"
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {inv.status === "accepted" ? "Aceptado" : inv.status === "expired" ? "Expirado" : "Pendiente"}
                          </span>
                        </div>
                        {inv.status === "pending" && (
                          <div className="flex items-center gap-1.5">
                            <input
                              readOnly
                              value={`${window.location.origin}/agents/join?token=${inv.token}`}
                              className="flex-1 px-1.5 py-1 bg-white border border-border-light rounded-sm text-[8px] font-mono select-all focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/agents/join?token=${inv.token}`);
                                showToast("Enlace de invitación copiado", "success");
                              }}
                              className="px-2.5 py-1 bg-gray-800 text-white font-bold rounded-sm hover:bg-gray-900 transition-colors border-none text-[9px] cursor-pointer"
                            >
                              Copiar
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
