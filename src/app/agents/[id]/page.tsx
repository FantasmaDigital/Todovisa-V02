"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "../../components/shared/Header";
import { Footer } from "../../components/shared/Footer";
import { useAuthStore } from "../../store/authStore";
import { AgentClientService } from "@/services/client/AgentClientService";
import { CheckoutModal } from "../../components/shared/CheckoutModal";

interface Agent {
  id: string;
  name: string;
  title: string;
  photo: string;
  rating: number;
  reviewsCount: number;
  languages: string[];
  countries: string[];
  specialties: string[];
  experience: string;
  availability: string;
  bio: string;
  whatsapp: string;
  featured: boolean;
  partnerType: "outsourced_agent" | "b2b_agency_entity";
  agencyName?: string;
  userId?: string;
}

export default function AgentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const headerRef = useRef(null);
  const { user } = useAuthStore();
  const agentId = params?.id as string;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Checkout modal states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!agentId) return;

    const fetchAgentDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await AgentClientService.getAgents();
        const activeApps = data.activeApps || [];
        const agencyProfiles = data.agencyProfiles || [];
        const agencyMemberIds = new Set(data.agencyMemberIds || []);

        const agencyUserIds = new Set(agencyProfiles.map((p: any) => p.id));
        
        // Find the matched agent
        const matchedApp = activeApps.find((app: any) => `agent-${app.user_id || app.application_id}` === agentId);

        if (matchedApp) {
          const phone = matchedApp.phone?.replace(/\D/g, "") || "50370200976";
          setAgent({
            id: `agent-${matchedApp.user_id || matchedApp.application_id}`,
            userId: matchedApp.user_id,
            name: matchedApp.full_name || matchedApp.email || "Asesor TodoVisa",
            title: `Asesor Independiente · ${(matchedApp.specialties || ["General"])[0]}`,
            photo: matchedApp.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedApp.full_name || "Asesor")}&background=0d9488&color=fff&size=200`,
            rating: 4.8,
            reviewsCount: 0,
            languages: matchedApp.languages || ["Español"],
            countries: matchedApp.target_countries || ["Estados Unidos"],
            specialties: matchedApp.specialties || ["Asesoría General"],
            experience: matchedApp.experience_years ? (/^\d+$/.test(matchedApp.experience_years.trim()) ? `${matchedApp.experience_years} años` : matchedApp.experience_years) : "—",
            availability: "Inmediata",
            bio: matchedApp.biography || "Asesor consular certificado en la red TodoVisa.",
            whatsapp: `https://wa.me/${phone}?text=Hola,%20me%20gustar%C3%ADa%20recibir%20asesor%C3%ADa.`,
            featured: false,
            partnerType: "outsourced_agent",
          });
        } else {
          setError("No se encontró el perfil de este asesor.");
        }
      } catch (err) {
        console.error("Error fetching agent profile:", err);
        setError("Error al cargar la información del asesor.");
      } finally {
        setLoading(false);
      }
    };

    fetchAgentDetails();
  }, [agentId]);

  const handleHireAgent = () => {
    if (!user) {
      showToast("Por favor, inicia sesión para poder contratar a este asesor.", "info");
      setTimeout(() => router.push("/auth/signin"), 1500);
      return;
    }
    if (user.role === "agent" || user.role === "agency") {
      showToast("Los agentes y agencias no pueden contratar asesoría.", "error");
      return;
    }
    if (user.hasPaidAdvisor) {
      showToast("Ya tienes contratada una asesoría activa. Redirigiendo a tu chat...", "info");
      setTimeout(() => router.push("/profile?tab=asesor"), 1500);
      return;
    }
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background-main font-sans">
      <Header headerRef={headerRef} />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 flex-1 flex flex-col gap-6 text-left">
        {/* Back Navigation */}
        <div className="mb-2">
          <button
            onClick={() => router.push("/agents")}
            className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent"
          >
            &larr; Volver a la Lista de Asesores
          </button>
        </div>

        {loading && (
          <div className="w-full bg-white border border-border-light rounded-lg p-12 text-center animate-pulse space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gray-200" />
              <div className="h-6 bg-gray-200 rounded w-48" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
            <div className="space-y-3 pt-6 max-w-xl mx-auto">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-4/5" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="max-w-md mx-auto w-full bg-white border border-border-light rounded-lg p-8 text-center shadow-xs">
            <span className="text-4xl">⚠️</span>
            <h3 className="text-lg font-bold text-text-primary mt-4 mb-2">Error de Perfil</h3>
            <p className="text-xs text-text-secondary mb-6">{error}</p>
            <button
              onClick={() => router.push("/agents")}
              className="px-6 py-2 bg-brand-primary text-white text-xs font-bold rounded hover:bg-brand-hover cursor-pointer"
            >
              Volver a Asesores
            </button>
          </div>
        )}

        {!loading && agent && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
            {/* Left/Main Content Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-lg border border-border-light shadow-xs overflow-hidden">
                <div className="p-8 bg-brand-light flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-border-light">
                  <img
                    src={agent.photo}
                    alt={`Foto de ${agent.name}`}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md flex-shrink-0"
                  />
                  <div className="text-center sm:text-left flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5">
                      <h2 className="text-2xl font-bold text-text-primary">{agent.name}</h2>
                      {agent.featured && (
                        <span className="mx-auto sm:mx-0 w-max bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                          ★ VERIFICADO
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-brand-primary mb-3">
                      {agent.title}
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                      <div className="flex items-center text-amber-500 font-bold text-sm">
                        <span className="text-text-primary mr-1">{agent.rating.toFixed(1)}</span>
                        <span className="text-amber-400 mr-1.5">★</span>
                        <span className="text-xs font-normal text-text-secondary">({agent.reviewsCount} evaluaciones)</span>
                      </div>
                      <span className="hidden sm:inline text-text-muted">|</span>
                      <p className="text-xs font-medium text-text-secondary">
                        Experiencia: <span className="font-bold text-text-primary">{agent.experience}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  {/* Biography */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Sobre mí</h4>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                      {agent.bio}
                    </p>
                  </div>

                  {/* Skills / Availability info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-border-light">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2.5">Idiomas de asesoría</h4>
                      <div className="flex flex-wrap gap-2">
                        {agent.languages.map((lang) => (
                          <span key={lang} className="bg-background-main border border-border-light text-text-secondary text-xs font-semibold px-3 py-1 rounded-sm">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2.5">Estado de disponibilidad</h4>
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${agent.availability === "Inmediata" ? "bg-status-success" : "bg-status-warning"}`}></span>
                        <span className="text-sm font-bold text-text-primary">
                          {agent.availability === "Inmediata" ? "Agenda abierta (Cupos hoy)" : `Disponible la ${agent.availability.toLowerCase()}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Specialties & Destinations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2.5">Especialidad por tipo de visa</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.specialties.map((spec) => (
                          <span key={spec} className="bg-brand-light text-brand-primary text-xs font-bold px-2.5 py-1 rounded-sm">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2.5">Países y Embajadas que domina</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.countries.map((country) => (
                          <span key={country} className="bg-gray-100 text-text-secondary text-xs font-bold px-2.5 py-1 rounded-sm border border-gray-200">
                            {country}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Steps/Workflow Info */}
              <div className="bg-white rounded-lg border border-border-light p-8 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">¿Cómo te ayuda tu asesor en TodoVisa?</h4>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-light text-brand-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                    <div>
                      <h5 className="text-sm font-bold text-text-primary">Evaluación inicial y perfilamiento</h5>
                      <p className="text-xs text-text-secondary mt-0.5">Analiza tu perfil para identificar fortalezas y debilidades de tu postulación consular.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-light text-brand-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                    <div>
                      <h5 className="text-sm font-bold text-text-primary">Llenado digital guiado de formularios</h5>
                      <p className="text-xs text-text-secondary mt-0.5">Se encarga de llenar el DS-160 u otros formularios consulares sin errores tipográficos.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-light text-brand-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                    <div>
                      <h5 className="text-sm font-bold text-text-primary">Simulacro de entrevista presencial</h5>
                      <p className="text-xs text-text-secondary mt-0.5">Te prepara con preguntas reales para que asistas con seguridad al consulado.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Action/Checkout Sidebar */}
            <div className="lg:col-span-1 sticky top-28 bg-white border border-border-light rounded-lg p-6 space-y-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold block mb-1">Servicio Premium con Asesor</span>
                <p className="text-2xl font-bold text-text-primary">$100.00 USD</p>
                <p className="text-[10px] text-text-muted mt-1 leading-normal">Pago único por perfilamiento, formularios y simulacro de entrevista.</p>
              </div>

              <div className="border-t border-border-light pt-4 space-y-3.5">
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span className="text-text-secondary">Asesoramiento personalizado 1 a 1</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span className="text-text-secondary">Revisión de expediente y documentos</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span className="text-text-secondary">Llenado de formularios incluido</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span className="text-text-secondary">Simulacro de entrevista consular</span>
                </div>
              </div>

              {(!user || (user.role !== "agent" && user.role !== "agency")) && (
                <button
                  onClick={handleHireAgent}
                  disabled={Boolean(user?.hasPaidAdvisor)}
                  className={`w-full py-3 text-xs font-bold rounded transition-colors shadow-sm flex items-center justify-center gap-1.5 ${
                    user?.hasPaidAdvisor
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                      : "bg-brand-primary hover:bg-brand-hover text-white cursor-pointer"
                  }`}
                >
                  {user?.hasPaidAdvisor ? "Asesoría Contratada" : "Contratar Asesoría"}
                </button>
              )}

              <div className="border-t border-border-light pt-4 text-center">
                <p className="text-[10px] text-text-muted">Garantía de reembolso si no te brindamos el acompañamiento pactado.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Checkout Modal */}
      {agent && isCheckoutOpen && (
        <CheckoutModal
          agent={agent}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={() => {
            setIsCheckoutOpen(false);
            router.push("/profile?tab=asesor");
          }}
        />
      )}

      {toast && (
        <div className={`fixed bottom-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded border shadow-xl animate-in slide-in-from-bottom-5 duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : toast.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-blue-50 border-blue-200 text-blue-800'
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
