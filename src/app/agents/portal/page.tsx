"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { Header } from "../../components/shared/Header";
import { Footer } from "../../components/shared/Footer";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { AgentClientService } from "@/services/client/AgentClientService";
import { MessageClientService } from "@/app/service/MessageClientService";
import { ProfileClientService } from "@/services/client/ProfileClientService";
import supabase from "@/app/lib/supabase";

interface AgentApplication {
  id: string;
  application_id: string;
  full_name: string;
  email: string;
  phone: string;
  country_residence: string;
  experience_years: string;
  linkedin: string;
  specialties: string[];
  target_countries: string[];
  languages: string[];
  biography: string;
  status: 'pending' | 'approved' | 'active' | 'rejected';
  terms_accepted: boolean;
  documents: {
    dui?: string | null;
    certificacion?: string | null;
    antecedentes?: string | null;
    domicilio?: string | null;
    titulo?: string | null;
    cv?: string | null;
  };
  signature_name?: string | null;
  signed_at?: string | null;
  created_at: string;
  is_local?: boolean;
  user_id?: string | null;
  payout_settings?: {
    method?: 'paypal' | 'ach';
    paypal_email?: string;
    bank_name?: string;
    account_type?: string;
    account_number?: string;
    routing_code?: string;
    tax_id?: string;
  } | null;
}

function AgentPortalContent() {
  const headerRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentApplication | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleViewDocument = async (e: React.MouseEvent<HTMLAnchorElement>, docUrl: string) => {
    e.preventDefault();
    if (!docUrl) return;

    const isSupabaseStorage = docUrl.includes("/storage/v1/object/public/todovisa/");
    if (isSupabaseStorage) {
      try {
        const filePath = docUrl.split("/storage/v1/object/public/todovisa/")[1];
        if (filePath) {
          const { data, error } = await supabase.storage
            .from("todovisa")
            .createSignedUrl(filePath, 60);

          if (error) throw error;
          if (data?.signedUrl) {
            window.open(data.signedUrl, "_blank");
            return;
          }
        }
      } catch (err) {
        console.error("Error generating signed URL, falling back to public URL:", err);
      }
    }
    window.open(docUrl, "_blank");
  };

  // Manual lookup input
  const [lookupId, setLookupId] = useState("");

  // Signature state
  const [termsChecked, setTermsChecked] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signing, setSigning] = useState(false);



  // Real Counts and Simulator Stats (computed/real)
  const [invitedCount, setInvitedCount] = useState(0);
  const [realTouristCases, setRealTouristCases] = useState(0);
  const [realStudentCases, setRealStudentCases] = useState(0);
  const [realMembers, setRealMembers] = useState<any[]>([]);
  const [realInvitations, setRealInvitations] = useState<any[]>([]);

  // B2B Client Requests (when a user contracts the agency)
  const [clientRequests, setClientRequests] = useState<any[]>([]);
  const [assigningRequestId, setAssigningRequestId] = useState<string | null>(null);
  const [selectedMemberForRequest, setSelectedMemberForRequest] = useState<Record<string, string>>({});
  const [memberCases, setMemberCases] = useState<Record<string, number>>({});

  const activeAdvisorsCount = agent?.is_local ? 3 : invitedCount;
  const finalTouristCases = agent?.is_local ? 6 : realTouristCases;
  const finalStudentCases = agent?.is_local ? 3 : realStudentCases;
  const finalRating = 4.8;

  const displayMembers = agent?.is_local
    ? [
        { id: "m1", name: "Lic. Sofía Rodríguez", role: "Especialista Senior", cases: 24, rating: 4.9, active: true },
        { id: "m2", name: "Mtra. Ana María Silva", role: "Asesora Consular", cases: 18, rating: 5.0, active: true },
        { id: "m3", name: "Lic. Carlos Mendoza", role: "Asesor General", cases: 12, rating: 4.8, active: true }
      ]
    : [
        ...realMembers.map(m => ({
          id: m.id,
          name: m.profile ? `${m.profile.first_name} ${m.profile.last_name}` : "Asesor TodoVisa",
          role: m.member_role === 'supervisor' ? "Supervisor" : "Asesor",
          cases: memberCases[m.member_id] || 0,
          rating: (memberCases[m.member_id] || 0) > 0 ? 4.8 : null,
          active: true
        })),
        ...realInvitations.map(inv => ({
          id: inv.id,
          name: inv.email,
          role: "Invitado",
          cases: 0,
          rating: null,
          active: inv.status === "accepted"
        }))
      ];

  // Onboarding Checklist
  const [onboardingSteps, setOnboardingSteps] = useState({
    training: true,
    payment: false,
  });

  const [hasNoAdvisors, setHasNoAdvisors] = useState(false);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);

  // Payout configuration states
  const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'ach'>('paypal');
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("Ahorros");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingCode, setRoutingCode] = useState("");
  const [taxId, setTaxId] = useState("");
  const [savingPayout, setSavingPayout] = useState(false);

  useEffect(() => {
    if (agent && agent.payout_settings) {
      const ps = agent.payout_settings;
      const timer = setTimeout(() => {
        if (ps.method) setPayoutMethod(ps.method);
        if (ps.paypal_email) setPaypalEmail(ps.paypal_email);
        if (ps.bank_name) setBankName(ps.bank_name);
        if (ps.account_type) setAccountType(ps.account_type);
        if (ps.account_number) setAccountNumber(ps.account_number);
        if (ps.routing_code) setRoutingCode(ps.routing_code);
        if (ps.tax_id) setTaxId(ps.tax_id);
        
        if (ps.method) {
          setOnboardingSteps(prev => ({ ...prev, payment: true }));
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [agent]);

  const fetchAgent = async (appId: string) => {
    setLoading(true);
    setError(null);
    try {
      const cleanId = appId.trim().toUpperCase();

      // INTERRUPTOR B2B MOCK
      if (cleanId.startsWith("B2B-")) {
        let currentUser = user;
        if (!currentUser) {
          try {
            const authStorage = localStorage.getItem("auth-storage");
            if (authStorage) {
              const parsed = JSON.parse(authStorage);
              currentUser = parsed?.state?.user || null;
            }
          } catch (_) {}
        }
        const mockEmail = cleanId === "B2B-MUNDO" ? "b2b@mundojoven.com" : "reservas1@volamosviajes.com";
        if (!currentUser || (currentUser.email?.toLowerCase() !== mockEmail.toLowerCase() && currentUser.role !== "admin" && currentUser.role !== "moderator")) {
          console.warn("Acceso no autorizado a la postulación B2B. Redireccionando al perfil.");
          router.push("/profile");
          return;
        }

        const mockAgency: AgentApplication = {
          id: "agency-b2b-volamos",
          application_id: cleanId,
          full_name: cleanId === "B2B-MUNDO" ? "Mundo Joven B2B S.A." : "Volamos Viajes S.A. de C.V.",
          email: mockEmail,
          phone: "+503 7020-0976",
          country_residence: "El Salvador",
          experience_years: "12",
          linkedin: "https://linkedin.com/company/volamosviajes",
          specialties: ["Turismo", "Estudio", "Negocios"],
          target_countries: ["Estados Unidos", "Canadá", "Inglaterra"],
          languages: ["Español", "Inglés"],
          biography: "Agencia de viajes corporativa certificada TodoVisa para el asesoramiento B2B de visados.",
          status: "approved",
          terms_accepted: false,
          documents: {},
          is_local: true,
          created_at: new Date().toISOString()
        };

        const localSave = localStorage.getItem(`agent_app_${cleanId}`);
        if (localSave) {
          const parsed = JSON.parse(localSave);
          setAgent(parsed);
          if (parsed.signature_name) setSignatureName(parsed.signature_name);
        } else {
          setAgent(mockAgency);
          localStorage.setItem(`agent_app_${cleanId}`, JSON.stringify(mockAgency));
          if (mockAgency.full_name) setSignatureName(mockAgency.full_name);
        }
        setLoading(false);
        return;
      }

      // Fetch agent application data from API
      const portalDetails = await AgentClientService.getPortalData(undefined, cleanId);
      const appData = portalDetails?.application;

      if (!appData) {
        throw new Error("No se encontró ninguna postulación con el Folio provisto. Por favor verifique el código.");
      }

      // Authorization Check
      let currentUser = user;
      if (!currentUser) {
        try {
          const authStorage = localStorage.getItem("auth-storage");
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            currentUser = parsed?.state?.user || null;
          }
        } catch (_) {}
      }

      const isAuthorized = currentUser && (
        (currentUser.id && appData.user_id && currentUser.id === appData.user_id) ||
        (currentUser.email && appData.email && currentUser.email.toLowerCase().trim() === appData.email.toLowerCase().trim()) ||
        currentUser.role === "admin" ||
        currentUser.role === "moderator"
      );

      if (!isAuthorized) {
        console.warn("Acceso no autorizado a la postulación. Redireccionando al perfil.");
        router.push("/profile");
        return;
      }

      setAgent(appData);
      if (appData.full_name) {
        setSignatureName(appData.full_name);
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      const isOffline = errorMsg.includes('fetch failed') || errorMsg.includes('ENOTFOUND') || errorMsg.includes('fetch');
      if (isOffline) {
        console.warn("⚠️ Buscando postulación en localStorage...");
        const localDataStr = localStorage.getItem(`agent_app_${appId.trim().toUpperCase()}`);
        if (localDataStr) {
          const localData = JSON.parse(localDataStr);
          setAgent({ ...localData, is_local: true });
          if (localData.full_name) {
            setSignatureName(localData.full_name);
          }
          setLoading(false);
          return;
        }
      }
      setError(errorMsg || "Error al buscar los datos.");
      setAgent(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentByUser = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const portalRes = await AgentClientService.getPortalData(user.id);
      let data = portalRes.application || portalRes.fallbackData;

      if (data) {
        setAgent(data);
        if (data.full_name) {
          setSignatureName(data.full_name);
        }
      } else {
        if (user.role === "agent") {
          const agencyApp = portalRes.agencyApp;
          setAgent({
            ...(agencyApp || {}),
            id: user.id,
            user_id: user.id,
            application_id: agencyApp?.application_id 
              ? agencyApp.application_id.replace("B2B-", "B2B-AGENT-") 
              : "B2B-AGENT-" + user.id.slice(0, 8).toUpperCase(),
            full_name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            phone: user.phone || "",
            country_residence: user.country || "",
            experience_years: agencyApp?.experience_years || "1",
            status: "active",
            created_at: agencyApp?.created_at || new Date().toISOString(),
            documents: agencyApp?.documents || {},
            specialties: agencyApp?.specialties || ["Asesoría General"],
            languages: agencyApp?.languages || ["Español"],
            target_countries: agencyApp?.target_countries || ["Estados Unidos"],
            biography: agencyApp?.biography || "Asesor certificado en la red TodoVisa.",
            signature_name: agencyApp?.signature_name || `${user.firstName} ${user.lastName}`,
            signed_at: agencyApp?.signed_at || agencyApp?.created_at || new Date().toISOString()
          });
          setSignatureName(`${user.firstName} ${user.lastName}`);
          setLoading(false);
          return;
        }
      }

        // Look up mock data from localstorage as fallback
        const localDataStr = localStorage.getItem(`agent_app_${user.email?.toUpperCase()}`);
        if (localDataStr) {
          const localData = JSON.parse(localDataStr);
          setAgent({ ...localData, is_local: true });
          if (localData.full_name) {
            setSignatureName(localData.full_name);
          }
        }
    } catch (err) {
      console.error("Error loading agent application by user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (idParam) {
        fetchAgent(idParam);
      } else if (user) {
        fetchAgentByUser();
      } else {
        setLoading(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [idParam, user]);

  // If corporate agency, verify that they have at least one advisor registered and count them
  useEffect(() => {
    if (!agent) {
      setHasNoAdvisors(false);
      return;
    }

    const checkAdvisors = async () => {
      const targetUserId = agent.user_id || agent.id;
      if (!targetUserId) return;

      setLoadingAdvisors(true);
      try {
        const teamData = await ProfileClientService.getTeam(targetUserId);
        const members = teamData.members || [];
        const invitations = teamData.invitations || [];

        setInvitedCount(members.length + invitations.length);
        setRealMembers(members);
        setRealInvitations(invitations);

        if (members.length > 0) {
          const counts: Record<string, number> = {};
          for (const m of members) {
            try {
              const comms = await ProfileClientService.getCommissions(m.member_id);
              counts[m.member_id] = comms?.length || 0;
            } catch (_) {}
          }
          setMemberCases(counts);
        }

        setHasNoAdvisors(false);

      } catch (err) {
        console.error("Error checking agency members in portal:", err);
      } finally {
        setLoadingAdvisors(false);
      }
    };

    checkAdvisors();
  }, [agent]);

  // Load pending client requests for B2B agencies
  useEffect(() => {
    if (!agent) return;
    const isAgency = agent.application_id?.startsWith("B2B-") && !agent.application_id?.includes("B2B-AGENT-");
    if (!isAgency) return;
    const agencyUserId = agent.user_id || agent.id;
    if (!agencyUserId || agencyUserId.startsWith("agency-b2b-")) return; // skip mock

    const loadClientRequests = async () => {
      try {
        const portalData = await AgentClientService.getPortalData(agencyUserId);
        setClientRequests(portalData.clientRequests || []);
      } catch (err) {
        console.error("Error loading client requests:", err);
      }
    };
    loadClientRequests();
  }, [agent]);

  const handleAssignMember = async (request: any) => {
    const memberId = selectedMemberForRequest[request.id];
    if (!memberId) {
      showToast("Selecciona un asesor antes de confirmar.", "error");
      return;
    }
    setAssigningRequestId(request.id);
    try {
      // 1. Get assigned member profile to pass name to client
      let memberName = "Tu asesor asignado";
      try {
        const profileData = await ProfileClientService.getProfile(memberId);
        if (profileData?.profile) {
          memberName = `${profileData.profile.first_name || ""} ${profileData.profile.last_name || ""}`.trim();
        }
      } catch (_) {}

      // 2. Insert message for client
      try {
        await MessageClientService.createMessage({
          user_id: request.client_id,
          agent_id: memberId,
          sender: "agent",
          text: `¡Hola! Soy ${memberName} de ${request.agency_name || "TodoVisa"}. A partir de ahora estaré a cargo de tu expediente. ¿Por dónde te gustaría comenzar?`
        });
      } catch (_) {}

      // 3. Update local state
      setClientRequests(prev =>
        prev.map(r => r.id === request.id
          ? { ...r, status: "assigned", assigned_member_id: memberId, assigned_member_name: memberName }
          : r
        )
      );

      showToast(`✅ Asesor asignado: ${memberName}. El chat con el cliente ha sido habilitado.`, "success");
    } catch (err: any) {
      console.error("Error assigning member:", err);
      showToast("Error al asignar asesor: " + err.message, "error");
    } finally {
      setAssigningRequestId(null);
    }
  };

  // Load real commissions/cases counts
  useEffect(() => {
    if (!agent) return;
    const loadRealCommissions = async () => {
      const targetUserId = agent.user_id || agent.id;
      if (!targetUserId) return;
      try {
        let agentIds = [targetUserId];
        if (agent.application_id?.startsWith("B2B-") && !agent.application_id?.includes("B2B-AGENT-")) {
          const teamData = await ProfileClientService.getTeam(targetUserId);
          if (teamData.members && teamData.members.length > 0) {
            agentIds = teamData.members.map((m: any) => m.member_id);
          }
        }

        let allComms: any[] = [];
        for (const id of agentIds) {
          const comms = await ProfileClientService.getCommissions(id);
          allComms = allComms.concat(comms || []);
        }

        const tourist = allComms.filter(c => c.service_type === "visa_us" || c.service_type === "visa_uk" || c.service_type === "full_service").length;
        const student = allComms.filter(c => c.service_type === "vipro").length;
        setRealTouristCases(tourist);
        setRealStudentCases(student);
      } catch (err) {
        console.error("Error loading commissions stats:", err);
      }
    };
    loadRealCommissions();
  }, [agent]);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    router.push(`/agents/portal?id=${lookupId.trim().toUpperCase()}`);
  };



  // Sign Contract Action
  const signContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;
    if (!termsChecked) {
      showToast("Debes marcar el checkbox para aceptar los términos y condiciones financieros.", "info");
      return;
    }
    if (!signatureName.trim()) {
      showToast("Debes escribir tu nombre completo como firma legal digital.", "info");
      return;
    }

    setSigning(true);
    try {
      const nowString = new Date().toISOString();
      if (agent.is_local) {
        const updated = {
          ...agent,
          status: "active" as const,
          signature_name: signatureName,
          signed_at: nowString,
        };
        localStorage.setItem(`agent_app_${agent.application_id}`, JSON.stringify(updated));
        setAgent(updated);
        showToast("¡Contrato Firmado con éxito (Local)! Bienvenido(a) oficialmente a la Red TodoVisa.", "success");
      } else {
        await AgentClientService.updateApplication({
          id: agent.id,
          updates: {
            status: "active",
            signature_name: signatureName,
            signed_at: nowString,
          },
        });

        setAgent((prev) =>
          prev
            ? {
                ...prev,
                status: "active",
                signature_name: signatureName,
                signed_at: nowString,
              }
            : null
        );
        showToast("¡Contrato Firmado con éxito! Bienvenido(a) oficialmente a la Red TodoVisa.", "success");
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      showToast("Error al firmar contrato: " + errMessage, "error");
    } finally {
      setSigning(false);
    }
  };

  // Simulator Math
  const getCommissionRate = () => {
    if (agent?.application_id?.startsWith("B2B-")) {
      return 0.85;
    }
    return 0.80;
  };
  const getGrossEarnings = () => {
    const cases = finalTouristCases * 150 + finalStudentCases * 250;
    if (agent?.application_id?.startsWith("B2B-") && !agent?.application_id?.includes("B2B-AGENT-")) {
      return cases * activeAdvisorsCount;
    }
    return cases;
  };
  const getAgentShare = () => getGrossEarnings() * getCommissionRate();
  const getPlatformFee = () => getAgentShare() * 0.05;
  const getNetEarnings = () => getAgentShare() - getPlatformFee();

  const savePayoutSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;

    setSavingPayout(true);
    const updatedSettings = {
      method: payoutMethod,
      paypal_email: payoutMethod === 'paypal' ? paypalEmail : "",
      bank_name: payoutMethod === 'ach' ? bankName : "",
      account_type: payoutMethod === 'ach' ? accountType : "",
      account_number: payoutMethod === 'ach' ? accountNumber : "",
      routing_code: payoutMethod === 'ach' ? routingCode : "",
      tax_id: payoutMethod === 'ach' ? taxId : "",
    };

    try {
      if (agent.is_local) {
        const updated = {
          ...agent,
          payout_settings: updatedSettings,
        };
        localStorage.setItem(`agent_app_${agent.application_id}`, JSON.stringify(updated));
        setAgent(updated);
        setOnboardingSteps(prev => ({ ...prev, payment: true }));
        showToast("¡Método de pago guardado localmente con éxito!", "success");
      } else {
        await AgentClientService.updateApplication({
          id: agent.id,
          updates: { payout_settings: updatedSettings },
        });

        setAgent((prev) =>
          prev
            ? {
                ...prev,
                payout_settings: updatedSettings,
              }
            : null
        );
        setOnboardingSteps(prev => ({ ...prev, payment: true }));
        showToast("¡Método de pago guardado exitosamente!", "success");
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      showToast("Error al guardar método de pago: " + errorMsg, "error");
    } finally {
      setSavingPayout(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background-main font-sans">
      <Header headerRef={headerRef} />

      {/* Hero Banner */}
      <div className="w-full bg-brand-primary text-white py-12 px-4 sm:px-6 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-emerald-400 uppercase mb-2">Mi Acreditación Red TodoVisa</p>
            <h1 className="text-3xl md:text-4xl font-serif text-white font-semibold leading-tight">
              {agent ? `Bienvenido, ${agent.full_name.split(" ")[0]}` : "Contrato y Onboarding"}
            </h1>
            <p className="text-white/85 text-xs md:text-sm mt-1 max-w-xl">
              Gestiona tu solicitud, firma el acuerdo comercial y monitorea tu plan de comisiones desde un solo lugar.
            </p>
          </div>
          {agent && (
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded border border-white/10 flex flex-col items-end">
              <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Folio de Postulación</span>
              <span className="text-sm font-mono font-bold text-emerald-400">{agent.application_id}</span>
            </div>
          )}
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex-1 flex flex-col gap-8">
        {agent && agent.status === "approved" && !agent.signed_at && (
          <div className="bg-amber-50 border border-amber-200 rounded-sm p-6 text-left shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <span>⚠️</span> Firma de Acuerdo Comercial Requerida
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Tu postulación ha sido aprobada por la administración. Para comenzar a operar, por favor lee el acuerdo comercial a continuación y firma digitalmente en el formulario inferior para activar tu cuenta de socio.
            </p>
          </div>
        )}

        {agent && agent.is_local && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-sm text-amber-900 text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <span className="flex items-center gap-2">
              <span>⚠️</span>
              <span><strong>Modo de Respaldo Local Activo:</strong> No se pudo establecer conexión con Supabase. Tu contrato y progreso se están guardando de forma segura en la memoria local de tu navegador.</span>
            </span>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="md:col-span-2 space-y-6">
              <div className="h-40 bg-gray-200 rounded-xl w-full"></div>
              <div className="h-64 bg-gray-200 rounded-xl w-full"></div>
            </div>
            <div className="md:col-span-1 space-y-6">
              <div className="h-48 bg-gray-200 rounded-xl w-full"></div>
              <div className="h-48 bg-gray-200 rounded-xl w-full"></div>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <div className="max-w-md mx-auto w-full bg-white border border-red-200 rounded-sm p-8 text-center my-10 shadow-sm animate-in fade-in duration-300">
            <span className="text-4xl text-red-500">⚠️</span>
            <h3 className="text-lg font-bold text-text-primary mt-4 mb-2">Error de Búsqueda</h3>
            <p className="text-xs text-red-600 mb-6 leading-relaxed">{error}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setError(null);
                  if (idParam) {
                    fetchAgent(idParam);
                  } else {
                    fetchAgentByUser();
                  }
                }}
                className="w-full py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover cursor-pointer"
              >
                Reintentar
              </button>
              <button
                onClick={() => router.push("/agents/portal")}
                className="w-full py-2 bg-white border border-border-light text-text-secondary text-xs font-bold rounded-sm hover:bg-background-hover cursor-pointer"
              >
                Volver al Inicio
              </button>
            </div>
          </div>
        )}

        {/* NO AGENT FOUND OR MANUAL SEARCH */}
        {!loading && !error && !agent && (
          <div className="max-w-xl mx-auto w-full bg-white border border-border-light rounded-sm p-8 my-10 shadow-sm flex flex-col gap-6 animate-in fade-in duration-300 text-left">
            <div className="text-center pb-4 border-b border-border-light">
              <span className="text-4xl">💼</span>
              <h3 className="text-lg font-bold text-text-primary mt-4 mb-2">Portal de Socios TodoVisa</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Aquí puedes firmar tu contrato, configurar tus comisiones y activar tu panel de acreditación.
              </p>
            </div>

            {user ? (
              <div className="space-y-4">
                <div className="p-4 bg-brand-light border border-border-light rounded-sm text-xs text-text-secondary leading-relaxed">
                  No encontramos ninguna solicitud de socio activa para la cuenta vinculada al correo <strong className="text-text-primary">{user.email}</strong>.
                </div>
                <button
                  onClick={() => router.push("/agents/apply")}
                  className="w-full py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-colors cursor-pointer text-center block"
                >
                  Postularme como Consultor / Agencia
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-text-secondary leading-relaxed">
                  Por favor inicia sesión con tu cuenta registrada para acceder a tu contrato y panel de socio de forma automática.
                </p>
                <button
                  onClick={() => router.push("/login?redirect=/agents/portal")}
                  className="w-full py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-colors cursor-pointer text-center block"
                >
                  Iniciar sesión
                </button>
              </div>
            )}

            {/* Manual Testing Lookup Form (collapsible) */}
            <details className="mt-4 pt-4 border-t border-border-light">
              <summary className="text-[10px] font-bold text-text-muted hover:text-text-secondary cursor-pointer uppercase tracking-wider select-none focus:outline-none">
                ¿Ingresar con un Folio de prueba? (Desarrollo)
              </summary>
              <div className="mt-4 space-y-4">
                <div className="flex bg-background-main p-1 rounded-sm border border-border-light">
                  <button
                    type="button"
                    onClick={() => setLookupId("B2B-VOLAMOS")}
                    className="flex-1 py-1.5 text-[10px] font-bold rounded-sm transition-all cursor-pointer bg-white text-brand-primary border border-border-light shadow-sm"
                  >
                    🏢 Agencia de prueba (B2B-VOLAMOS)
                  </button>
                </div>
                <form onSubmit={handleLookupSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={lookupId}
                    onChange={(e) => setLookupId(e.target.value)}
                    placeholder="Escribe el Folio (ej: B2B-VOLAMOS)"
                    className="w-full text-center px-3 py-2 bg-background-main border border-border-light rounded-sm text-xs font-mono font-bold focus:border-brand-primary focus:outline-none text-text-primary"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-sm transition-colors cursor-pointer"
                  >
                    Buscar Folio de Prueba
                  </button>
                </form>
              </div>
            </details>
          </div>
        )}

        {/* AGENT PORTAL WORKFLOW STATES */}
        {!loading && !error && agent && (
          <div className="w-full space-y-6 text-left">
            {/* Back navigation */}
            <div className="mb-2">
              <button
                onClick={() => router.push("/profile")}
                className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent"
              >
                &larr; Volver a mi Perfil
              </button>
            </div>

            {/* Warning banner if agency has no advisors */}
            {hasNoAdvisors && (
              <div className="bg-amber-50 border border-amber-200 rounded-sm p-5 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn shadow-xs w-full mb-2">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <h3 className="font-bold text-amber-800 text-sm">Se requiere registrar asesores</h3>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Estimado representante de la agencia, actualmente no tienes ningún asesor registrado bajo la acreditación de tu empresa. Es obligatorio agregar al menos un asesor para poder comenzar a ofrecer servicios de agentes, recibir clientes y ver comisiones.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/profile?tab=portal_agente#seccion-equipo")}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-sm shadow-sm transition-all focus:outline-none cursor-pointer flex-shrink-0 text-center animate-pulse"
                >
                  Invitar Asesores Ahora
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
            
            {/* LEFT COLUMN - MAIN STATUS INFO AND SECTIONS */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* STATE 1: PENDING REVIEW */}
              {agent.status === "pending" && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className="bg-amber-50 border border-amber-200 rounded-sm p-6 flex items-start gap-4">
                    <span className="text-2xl mt-0.5">⏳</span>
                    <div>
                      <h4 className="font-bold text-amber-800 text-sm">Postulación en Revisión Técnica</h4>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        Nuestro equipo administrativo está validando tus credenciales, antecedentes penales y tu historial de experiencia laboral. Este proceso toma habitualmente entre 3 y 5 días hábiles.
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 text-[10px] text-amber-800 font-bold bg-amber-100/50 px-2.5 py-1 rounded border border-amber-200">
                        ESTADO ACTUAL: PENDIENTE DE REVISIÓN
                      </div>
                    </div>
                  </div>


                  {/* Submission Details Summary */}
                  <div className="bg-white border border-border-light rounded-sm p-6 sm:p-8 space-y-8">
                    <div>
                      <h3 className="text-md font-bold text-text-primary mb-4 pb-2 border-b border-border-light">Resumen del Expediente Enviado</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs text-text-secondary">
                        <div>
                          <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-1">Nombre Completo</span>
                          <p className="font-medium text-text-primary">{agent.full_name}</p>
                        </div>
                        <div>
                          <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-1">Tipo de Socio</span>
                          <p className="font-medium text-text-primary">
                            {agent.application_id?.startsWith("B2B-") ? "Agencia Partner Corporativa" : "Asesor Consultor Independiente"}
                          </p>
                        </div>
                        <div>
                          <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-1">Email</span>
                          <p className="font-medium text-text-primary">{agent.email}</p>
                        </div>
                        <div>
                          <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-1">Teléfono</span>
                          <p className="font-medium text-text-primary">{agent.phone}</p>
                        </div>
                        <div>
                          <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-1">País de Residencia</span>
                          <p className="font-medium text-text-primary">{agent.country_residence}</p>
                        </div>
                        <div>
                          <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-1">Años de Experiencia</span>
                          <p className="font-medium text-text-primary">
                            {/^\d+$/.test(String(agent.experience_years).trim()) ? `${agent.experience_years} Años` : agent.experience_years}
                          </p>
                        </div>
                        {agent.linkedin && (
                          <div className="sm:col-span-2 md:col-span-3">
                            <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-1">LinkedIn / Portafolio</span>
                            <a href={agent.linkedin} target="_blank" rel="noopener noreferrer" className="text-brand-primary font-medium hover:underline break-all">
                              {agent.linkedin}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Qualifications / Profile */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-border-light text-xs text-text-secondary">
                      <div>
                        <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-2">Especialidades</span>
                        {agent.specialties && agent.specialties.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {agent.specialties.map((s, idx) => (
                              <span key={idx} className="bg-gray-100 text-text-primary px-2 py-0.5 rounded text-[10px] font-medium border border-gray-200">
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="italic text-text-muted">No especificadas</p>
                        )}
                      </div>

                      <div>
                        <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-2">Destinos de Interés</span>
                        {agent.target_countries && agent.target_countries.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {agent.target_countries.map((c, idx) => (
                              <span key={idx} className="bg-blue-50/50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-medium border border-blue-100">
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="italic text-text-muted">No especificados</p>
                        )}
                      </div>

                      <div>
                        <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-2">Idiomas</span>
                        {agent.languages && agent.languages.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {agent.languages.map((l, idx) => (
                              <span key={idx} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-medium border border-emerald-100">
                                {l}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="italic text-text-muted">No especificados</p>
                        )}
                      </div>
                    </div>

                    {/* Biography */}
                    {agent.biography && (
                      <div className="pt-6 border-t border-border-light text-xs text-text-secondary">
                        <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-2">Carta de Presentación / Biografía</span>
                        <p className="leading-relaxed whitespace-pre-wrap bg-background-main/30 p-4 rounded border border-border-light font-mono text-[11px] text-text-primary">
                          {agent.biography}
                        </p>
                      </div>
                    )}
                  </div>
                  </div>
              )}

              {/* STATE 2 & 3: APPROVED OR ACTIVE CONTRACT */}
              {(agent.status === "approved" || agent.status === "active") && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  {agent.status === "active" ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-6 flex items-start gap-4 animate-fadeIn">
                      <span className="text-2xl mt-0.5">✅</span>
                      <div className="flex-1 text-left">
                        <h4 className="font-bold text-emerald-800 text-sm">Contrato Activo e Incorporado</h4>
                        <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                          Tu estatus como Agencia/Socio de la Red TodoVisa está activo. Tu acuerdo comercial ha sido firmado digitalmente y se encuentra plenamente vigente.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-6 flex items-start gap-4 animate-fadeIn">
                      <span className="text-2xl mt-0.5">🎉</span>
                      <div className="text-left">
                        <h4 className="font-bold text-emerald-800 text-sm">
                          {agent.application_id.startsWith("B2B-") 
                            ? "¡Alianza Comercial Aprobada con Éxito!" 
                            : "¡Postulación Aprobada con Éxito!"}
                        </h4>
                        <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                          {agent.application_id.startsWith("B2B-")
                            ? "Felicidades, la alianza de distribución comercial ha sido validada. Hemos redactado tu acuerdo comercial corporativo. Por favor, lee los términos a continuación, proporciona la firma digital del representante legal y acéptalo para comenzar."
                            : "Felicidades, tu perfil ha superado las validaciones técnicas. Hemos redactado tu acuerdo comercial. Por favor, lee los términos del contrato comercial a continuación, proporciona tu firma electrónica digital y acéptalo para comenzar."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* The Contract Document */}
                  <div className="bg-white border border-border-light rounded-sm shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-gray-50 border-b border-border-light px-6 py-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
                        {agent.application_id.startsWith("B2B-") 
                          ? "ACUERDO_ALIANZA_DISTRIBUCION_AGENCIA.pdf" 
                          : "CONTRATO_AGENTE_TODOVISA.pdf"}
                      </span>
                      {agent.status === "active" ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded">CONTRATO FIRMADO</span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold px-2 py-0.5 rounded">PENDIENTE DE FIRMA</span>
                      )}
                    </div>

                    {/* Scrollable contract text */}
                    {agent.application_id.startsWith("B2B-") ? (
                      <div className="p-6 md:p-8 max-h-[350px] overflow-y-auto space-y-6 text-xs text-text-secondary leading-relaxed bg-[#fafafa] border-b border-border-light font-mono scrollbar-thin text-left">
                        <h3 className="text-center font-bold text-text-primary text-sm uppercase tracking-wide">
                          CONTRATO DE ALIANZA COMERCIAL Y DISTRIBUCIÓN DE SERVICIOS - AGENCIAS
                        </h3>
                        <p>
                          Conste por el presente documento el Contrato de Alianza Comercial y Distribución de Asesoría Consular (en adelante, el &quot;Acuerdo de Alianza&quot;), celebrado entre:
                        </p>
                        <p>
                          <strong>TodoVisa S.A. de C.V.</strong>, y la Agencia de Viajes socia cuyos datos se detallan en el Folio B2B <strong>{agent.application_id}</strong> (en adelante, la &quot;Agencia&quot;).
                        </p>
                        <div>
                          <h4 className="font-bold text-text-primary uppercase text-[10px] mb-1">CLÁUSULA PRIMERA: OBJETO DEL ACUERDO</h4>
                          <p>
                            La Agencia distribuirá el servicio premium de perfilamiento TodoVisa a través de su propia red de agentes de viajes corporativos, asignando a los asesores calificados de su equipo para llevar a cabo la revisión documental del cliente final.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-text-primary uppercase text-[10px] mb-1">CLÁUSULA SEGUNDA: COMISIONES CORPORATIVAS</h4>
                          <p>
                            La Agencia percibirá una tasa de comisión del 75% neto sobre las ventas de asesoría consular procesadas. Adicionalmente, si el volumen consolidado de la Agencia supera los 15 expedientes exitosos al mes, se aplicará un Bono Corporativo del 10% adicional (total 85% de retribución neta).
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-text-primary uppercase text-[10px] mb-1">CLÁUSULA TERCERA: CONFIDENCIALIDAD DE CLIENTES</h4>
                          <p>
                            Toda la información personal de los clientes captados por la Agencia y procesada en el portal es confidencial y no podrá ser compartida ni comercializada fuera del alcance de la solicitud de visado respectiva.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-bold text-text-primary uppercase text-[10px] mb-1">CLÁUSULA CUARTA: CONFIDENCIALIDAD DE DATOS</h4>
                          <p>
                            El Agente reconoce que tendrá acceso a datos altamente sensibles (números de pasaportes, datos financieros, actas de nacimiento y biografías). Se obliga a no divulgar, guardar copias externas, vender o utilizar estos datos para fines ajenos al proceso migratorio del cliente asignado. Cualquier filtración será causal de baja inmediata y acciones legales según la Ley de Protección de Datos de El Salvador.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 md:p-8 max-h-[350px] overflow-y-auto space-y-6 text-xs text-text-secondary leading-relaxed bg-[#fafafa] border-b border-border-light font-mono scrollbar-thin text-left">
                        <h3 className="text-center font-bold text-text-primary text-sm uppercase tracking-wide">
                          CONTRATO DE PRESTACIÓN DE SERVICIOS - AGENTE CONSULTOR INDEPENDIENTE
                        </h3>
                        
                        <p>
                          Conste por el presente documento el Contrato de Prestación de Servicios de Consultoría Migratoria Independiente (en adelante, el &quot;Acuerdo&quot;), celebrado entre:
                        </p>
                        <p>
                          <strong>TodoVisa S.A. de C.V.</strong>, con domicilio en San Salvador, El Salvador (en adelante, &quot;La Plataforma&quot;); y el postulante cuyos datos de identidad se detallan en el Folio <strong>{agent.application_id}</strong> (en adelante, el &quot;Agente&quot;). Ambos denominados conjuntamente como las &quot;Partes&quot;.
                        </p>

                        <div>
                          <h4 className="font-bold text-text-primary uppercase text-[10px] mb-1">CLÁUSULA PRIMERA: OBJETO DEL ACUERDO</h4>
                          <p>
                            El Agente se une a la Red de Especialistas TodoVisa de manera independiente, obligándose a prestar servicios de orientación, revisión de expedientes, llenado digital de solicitudes de visa (ej. DS-160, VAF1A) y asesoramiento de simulacro de entrevista consular para los clientes asignados por La Plataforma.
                          </p>
                        </div>

                        <div>
                          <h4 className="font-bold text-text-primary uppercase text-[10px] mb-1">CLÁUSULA SEGUNDA: RÉGIMEN FINANCIERO Y COMISIONES</h4>
                          <p>
                            Las partes pactan de mutuo acuerdo la siguiente estructura de compensación económica:
                          </p>
                          <ul className="list-disc pl-5 mt-1.5 space-y-1">
                            <li><strong>Comisión Base (60%):</strong> El Agente percibirá el sesenta por ciento (60%) neto de la tarifa de asesoría cobrada oficialmente al cliente a través de la pasarela de TodoVisa.</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-bold text-text-primary uppercase text-[10px] mb-1">CLÁUSULA TERCERA: MÉTODOS Y CICLO DE PAGO</h4>
                          <p>
                            Las comisiones correspondientes a los procesos marcados como &quot;Cerrados y Aprobados por el Cliente&quot; serán acumuladas semanalmente. TodoVisa efectuará el pago al Agente cada día <strong>Viernes hábil</strong> mediante transferencia bancaria (ACH) o el procesador de pagos registrado en su perfil.
                          </p>
                        </div>

                        <div>
                          <h4 className="font-bold text-text-primary uppercase text-[10px] mb-1">CLÁUSULA CUARTA: CONFIDENCIALIDAD DE DATOS</h4>
                          <p>
                            El Agente reconoce que tendrá acceso a datos altamente sensibles (números de pasaportes, datos financieros, actas de nacimiento y biografías). Se obliga a no divulgar, guardar copias externas, vender o utilizar estos datos para fines ajenos al proceso migratorio del cliente asignado. Cualquier filtración será causal de baja inmediata y acciones legales según la Ley de Protección de Datos de El Salvador.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Signature Form or Signed Confirmation */}
                    {agent.status === "active" ? (
                      <div className="p-6 bg-emerald-50/40 border-t border-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs animate-fadeIn">
                        <div className="text-left">
                          <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Firma Digital Registrada</span>
                          <p className="text-sm font-serif italic text-emerald-800 font-bold mt-0.5">{agent.signature_name || agent.full_name}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Fecha de Firma Digital</span>
                          <p className="font-semibold text-text-primary mt-0.5">
                            {agent.signed_at ? new Date(agent.signed_at).toLocaleString("es-SV") : new Date(agent.created_at).toLocaleString("es-SV")}
                          </p>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1.5 rounded border border-emerald-200 flex items-center gap-1 self-stretch sm:self-auto justify-center">
                          ✅ Contrato Firmado Digitalmente
                        </span>
                      </div>
                    ) : (
                      <form onSubmit={signContract} className="p-6 space-y-5 bg-white">
                        <div className="flex items-start gap-3">
                          <input
                            id="terms"
                            type="checkbox"
                            checked={termsChecked}
                            onChange={(e) => setTermsChecked(e.target.checked)}
                            className="mt-1 w-4 h-4 border border-border-light text-brand-primary rounded-sm focus:ring-brand-primary"
                          />
                          <label htmlFor="terms" className="text-xs text-text-secondary leading-normal cursor-pointer select-none text-left">
                            {agent.application_id.startsWith("B2B-") 
                              ? <span>Acepto los términos de alianza comercial corporativa, las comisiones financieras corporativas del 75% al 85% y las cláusulas penales por filtración de datos de clientes.</span>
                              : <span>He leído en su totalidad y de conformidad, <strong>acepto los términos comerciales</strong>, las comisiones financieras del 60% neto y las cláusulas penales por incumplimiento de confidencialidad de datos.</span>}
                          </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end pt-2">
                          <div>
                            <label htmlFor="signature-input" className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5 text-left">
                              {agent.application_id.startsWith("B2B-") 
                                ? "Firma Digital de Representante Legal (Escribe tu Nombre)"
                                : "Firma Legal Digital (Escribe tu Nombre Completo)"}
                            </label>
                            <input
                              id="signature-input"
                              type="text"
                              value={signatureName}
                              onChange={(e) => setSignatureName(e.target.value)}
                              placeholder="Nombre como firma"
                              className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus focus:outline-none transition-all text-text-primary font-serif italic"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={signing || !termsChecked || !signatureName.trim()}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-sm transition-all focus:outline-none cursor-pointer flex items-center justify-center gap-2"
                          >
                            {signing ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Firmando contrato...
                              </>
                            ) : (
                              agent.application_id.startsWith("B2B-") 
                                ? "🤝 Firmar y Activar Alianza Comercial"
                                : "✍️ Firmar y Activar Contrato"
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN - SIDEBAR CHECKLIST & CANDIDATE CARD */}
            <div className="lg:col-span-1 space-y-6 w-full">
              
              {/* STATUS CARD */}
              <div className="bg-white border border-border-light rounded-sm p-6 shadow-sm flex flex-col gap-4">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-light pb-2">
                  Estatus Comercial
                </h4>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Estatus actual:</span>
                  <span className={`font-bold px-2.5 py-1 rounded text-[10px] border ${
                    agent.status === "pending"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : agent.status === "approved"
                      ? "bg-blue-50 text-blue-800 border-blue-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                  }`}>
                    {agent.status === "pending" && "EN REVISIÓN"}
                    {agent.status === "approved" && "APROBADO"}
                    {agent.status === "active" && "CONTRATO ACTIVO"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Folio único:</span>
                  <span className="font-mono font-semibold text-text-primary">{agent.application_id}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Fecha registro:</span>
                  <span className="text-text-primary">{new Date(agent.created_at).toLocaleDateString()}</span>
                </div>
              </div>



              {/* DOCUMENTS CARD */}
              <div className="bg-white border border-border-light rounded-sm p-6 shadow-sm flex flex-col gap-4">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-light pb-2">
                  Documentación Adjunta
                </h4>

                <div className="space-y-3">
                  {[
                    { key: "dui", label: "Documento Identidad (DUI)" },
                    { key: "certificacion", label: "Certificación Profesional" },
                    { key: "antecedentes", label: "Antecedentes Penales" },
                    { key: "cv", label: "Currículum Vitae (CV)" },
                    { key: "domicilio", label: "Comprobante de Domicilio" },
                    { key: "titulo", label: "Título Profesional / Brochure" }
                  ].map((doc) => {
                    const docUrl = agent.documents?.[doc.key as keyof typeof agent.documents];
                    const hasDoc = !!docUrl;
                    const isValidUrl = hasDoc && (docUrl.startsWith("http://") || docUrl.startsWith("https://") || docUrl.startsWith("/"));
                    
                    return (
                      <div key={doc.key} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0 last:pb-0">
                        <span className="text-text-secondary">{doc.label}</span>
                        {hasDoc ? (
                          isValidUrl ? (
                            <a
                              href={docUrl}
                              onClick={(e) => handleViewDocument(e, docUrl)}
                              className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              ✓ Ver Documento
                            </a>
                          ) : (
                            <span className="text-emerald-600 font-bold">✓ Recibido</span>
                          )
                        ) : (
                          <span className="text-text-muted font-medium">No adjuntado</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
          </div>
        )}
      </main>

      <Footer />

      {toast && (
        <div className={`fixed bottom-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-sm border shadow-xl animate-in slide-in-from-bottom-5 duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : toast.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-blue-50 border-blue-200 text-blue-850'
        }`}>
          <span className="text-base select-none">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <span className="text-xs font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-text-muted hover:text-text-primary font-bold focus:outline-none cursor-pointer">✕</button>
        </div>
      )}
    </div>
  );
}

export default function AgentPortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-background-main p-8 animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-96 bg-gray-200 rounded-2xl"></div>
          <div className="md:col-span-1 h-96 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    }>
      <AgentPortalContent />
    </Suspense>
  );
}
