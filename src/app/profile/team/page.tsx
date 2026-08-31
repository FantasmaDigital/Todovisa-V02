"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "../../components/shared/Header";
import { Footer } from "../../components/shared/Footer";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "next/navigation";
import { ROLES } from "../../constants/roles";
import { ProfileClientService } from "@/services/client/ProfileClientService";

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

  // Fetch agency team members & invitations
  const loadAgencyTeamData = async () => {
    if (!user) return;
    setIsLoadingMembers(true);
    setIsLoadingInvitations(true);
    try {
      // Validate role with the API
      const profileRes = await ProfileClientService.getProfile(user.id);
      const apiRole = profileRes?.profile?.role;
      if (apiRole !== ROLES.AGENCY) {
        router.push("/profile");
        return;
      }

      const teamData = await ProfileClientService.getTeam(user.id);
      setAgencyMembers(teamData.members || []);
      setAgencyInvitations(teamData.invitations || []);
    } catch (err) {
      console.error("Error fetching agency team data:", err);
      router.push("/profile");
    } finally {
      setIsLoadingMembers(false);
      setIsLoadingInvitations(false);
    }
  };

  useEffect(() => {
    if (isMounted && user) {
      loadAgencyTeamData();
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

      await ProfileClientService.inviteTeamMember({
        agency_id: user.id,
        email: inviteEmail.trim().toLowerCase(),
        token,
        expires_at: expiresAt.toISOString(),
        status: "pending"
      });

      showToast(`Invitación generada para ${inviteEmail.trim()}`, "success");
      setInviteEmail("");
      loadAgencyTeamData();
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

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex-grow">
        {/* Back navigation */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/agents/portal")}
            className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent"
          >
            &larr; Volver al Panel
          </button>
        </div>

        <div className="mb-8 pb-4 border-b border-border-light text-left">
          <h1 className="text-2xl font-bold text-text-primary">Programa de Recomendaciones y Referidos</h1>
          <p className="text-xs text-text-secondary mt-1">
            La modalidad de adición de sub-agentes ha sido actualizada. Las agencias asociadas generan y comparten su **Link de Referidos** para recibir el **20% de comisión por cada compra**.
          </p>
        </div>

        {/* Notice Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 mb-8 text-left">
          <div className="flex items-start gap-3">
            <span className="text-xl">📢</span>
            <div>
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Actualización de Funcionalidad de Agencia</h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Las agencias registradas en TodoVisa ya no agregan agentes directamente a su equipo. En su lugar, cada agencia cuenta con un <strong>enlace de referidos exclusivo</strong>. Al compartir este enlace con tus clientes finales, obtendrás el <strong>20% de la compra</strong> de cada proceso de visado realizado con TodoVisa.
              </p>
            </div>
          </div>
        </div>

        {/* Referral Link Generator Box */}
        <div className="max-w-2xl border border-border-light rounded-sm p-6 bg-white space-y-4 text-left shadow-xs">
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-1">Tu Link de Referido de Agencia</h3>
            <p className="text-xs text-text-secondary">Comparte este enlace con tus clientes para atribuir automáticamente la comisión del 20% a tu cuenta.</p>
          </div>


          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              readOnly
              value={`${typeof window !== "undefined" ? `${window.location.origin}/referral` : "https://todovisa.com/referral"}?ref=${user.id}`}
              className="flex-1 px-3 py-2 bg-background-main border border-border-light rounded-sm text-xs font-mono text-text-primary select-all focus:outline-none"
            />
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  navigator.clipboard.writeText(`${window.location.origin}/referral?ref=${user.id}`);
                  showToast("¡Link de referido copiado al portapapeles!", "success");
                }
              }}

              className="px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-colors cursor-pointer border-none flex items-center gap-1.5"
            >
              📋 Copiar Link
            </button>
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
