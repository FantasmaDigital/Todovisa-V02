"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import { UserAvatar } from "../components/shared/UserAvatar";
import { useAuthStore } from "../store/authStore";
import { AgentClientService } from "@/services/client/AgentClientService";
import { useRouter } from "next/navigation";
import { CheckoutModal } from "../components/shared/CheckoutModal";

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
  /** real user_id from profiles/agent_applications, used for checkout */
  userId?: string;
}

export default function AgentesPage() {
  const headerRef = useRef(null);
  const router = useRouter();
  const { user } = useAuthStore();

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("Todos");
  const [selectedSpecialty, setSelectedSpecialty] = useState("Todos");
  const [selectedLanguage, setSelectedLanguage] = useState("Todos");
  const [selectedAvailability, setSelectedAvailability] = useState("Todos");




  // Checkout modal states
  const [checkoutAgent, setCheckoutAgent] = useState<Agent | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // ── REAL DATA FROM SUPABASE ───────────────────────────────────────────────
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchFromDB = async () => {
      setLoadingAgents(true);
      const list: Agent[] = [];

      try {
        const data = await AgentClientService.getAgents();
        const agencyProfiles = data.agencyProfiles || [];
        const agencyAppsMap = data.agencyAppsMap || {};
        const activeApps = data.activeApps || [];
        const agencyMemberIds = new Set(data.agencyMemberIds || []);

        // 1. Agencies (B2B Agencies are not listed directly for hire, they operate via referral links)

        // 2. Independent agents
        const agencyUserIds = new Set(agencyProfiles.map((p: any) => p.id));
        activeApps.forEach((app: any) => {
          if (agencyMemberIds.has(app.user_id) || agencyUserIds.has(app.user_id)) return;
          if (app.application_id?.startsWith("B2B-")) return;

          const phone = app.phone?.replace(/\D/g, "") || "50370200976";
          list.push({
            id: `agent-${app.user_id || app.application_id}`,
            userId: app.user_id,
            name: app.full_name || app.email || "Asesor TodoVisa",
            title: `Asesor Independiente · ${(app.specialties || ["General"])[0]}`,
            photo: app.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.full_name || "Asesor")}&background=0d9488&color=fff&size=200`,
            rating: 4.8,
            reviewsCount: 0,
            languages: app.languages || ["Español"],
            countries: app.target_countries || ["Estados Unidos"],
            specialties: app.specialties || ["Asesoría General"],
            experience: app.experience_years ? (/^\d+$/.test(app.experience_years.trim()) ? `${app.experience_years} años` : app.experience_years) : "—",
            availability: "Inmediata",
            bio: app.biography || "Asesor consular certificado en la red TodoVisa.",
            whatsapp: `https://wa.me/${phone}?text=Hola,%20me%20gustar%C3%ADa%20recibir%20asesor%C3%ADa.`,
            featured: false,
            partnerType: "outsourced_agent",
          });
        });
      } catch (err) {
        console.error("Error fetching agents from DB:", err);
      }

      setAgents(list);
      setLoadingAgents(false);
    };

    fetchFromDB();
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const handleHireAgent = (agent: Agent) => {
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
    setCheckoutAgent(agent);
    setIsCheckoutOpen(true);
  };

  // Build dynamic filter options from real data
  const allCountries = ["Todos", ...Array.from(new Set(agents.flatMap(a => a.countries))).sort()];
  const allSpecialties = ["Todos", ...Array.from(new Set(agents.flatMap(a => a.specialties))).sort()];
  const allLanguages = ["Todos", ...Array.from(new Set(agents.flatMap(a => a.languages))).sort()];
  const availabilities = ["Todos", "Inmediata", "Próxima semana"];
  // Filter logic
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.bio.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCountry =
      selectedCountry === "Todos" ||
      agent.countries.some((c) => c.toLowerCase() === selectedCountry.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === "Todos" ||
      agent.specialties.some((s) => s.toLowerCase() === selectedSpecialty.toLowerCase());

    const matchesLanguage =
      selectedLanguage === "Todos" ||
      agent.languages.some((l) => l.toLowerCase() === selectedLanguage.toLowerCase());

    const matchesAvailability =
      selectedAvailability === "Todos" ||
      agent.availability.toLowerCase() === selectedAvailability.toLowerCase();


    return matchesSearch && matchesCountry && matchesSpecialty && matchesLanguage && matchesAvailability;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCountry("Todos");
    setSelectedSpecialty("Todos");
    setSelectedLanguage("Todos");
    setSelectedAvailability("Todos");
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background-main">
      <Header headerRef={headerRef} />

      {/* Banner de Bienvenida */}
      <div className="w-full bg-brand-primary py-14 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-3">Red TodoVisa</p>
          <h1 className="text-4xl md:text-5xl text-white leading-tight mb-4 font-semibold font-serif italic">
            Encuentra a tu agente certificado
          </h1>
          <p className="text-white/95 text-base md:text-lg max-w-2xl leading-relaxed">
            Te conectamos con los mejores asesores especializados. Elige al experto ideal para tu destino, tipo de visa e idioma y asegura un trámite sin contratiempos.
          </p>
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 flex-1 flex flex-col lg:flex-row gap-8">

        {/* Panel Izquierdo: Filtros */}
        <aside className="w-full lg:w-1/4 flex-shrink-0">
          <div className="bg-white rounded-lg border border-border-light p-6 sticky top-28 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-light">
              <h3 className="text-md font-bold text-text-primary tracking-wide">Filtros de Búsqueda</h3>
              {(searchTerm || selectedCountry !== "Todos" || selectedSpecialty !== "Todos" || selectedLanguage !== "Todos" || selectedAvailability !== "Todos") && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-brand-primary hover:text-brand-hover hover:underline transition-colors"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            {/* Búsqueda por texto */}
            <div className="mb-5">
              <label htmlFor="search-input" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                Buscar por nombre
              </label>
              <div className="relative">
                <input
                  id="search-input"
                  type="text"
                  placeholder="Ej. Sofía Rodríguez..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-all placeholder:text-text-muted"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xs font-semibold p-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filtro de País */}
            <div className="mb-5">
              <label htmlFor="country-select" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                País de Destino
              </label>
              <select
                id="country-select"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus transition-all text-text-primary"
              >
                {allCountries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Filtro de Especialidad */}
            <div className="mb-5">
              <label htmlFor="specialty-select" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                Tipo de Visa
              </label>
              <select
                id="specialty-select"
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus transition-all text-text-primary"
              >
                {allSpecialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty === "Todos" ? "Todas las especialidades" : specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Idiomas */}
            <div className="mb-5">
              <label htmlFor="language-select" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                Idioma
              </label>
              <select
                id="language-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus transition-all text-text-primary"
              >
                {allLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang === "Todos" ? "Todos los idiomas" : lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Disponibilidad */}
            <div className="mb-5">
              <label htmlFor="availability-select" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                Disponibilidad
              </label>
              <select
                id="availability-select"
                value={selectedAvailability}
                onChange={(e) => setSelectedAvailability(e.target.value)}
                className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus transition-all text-text-primary"
              >
                {availabilities.map((avail) => (
                  <option key={avail} value={avail}>
                    {avail === "Todos" ? "Cualquier disponibilidad" : avail}
                  </option>
                ))}
              </select>
            </div>


          </div>
        </aside>

        {/* Panel Derecho: Resultados y Cartas */}
        <section className="w-full lg:w-3/4 flex flex-col">

          {/* Contador y metadatos */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-medium text-text-secondary">
              {loadingAgents
                ? "Cargando asesores..."
                : <>Mostrando <span className="font-semibold text-text-primary">{filteredAgents.length}</span> {filteredAgents.length === 1 ? "resultado" : "resultados"}</> 
              }
            </p>
          </div>

          {/* Loading skeleton */}
          {loadingAgents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-lg border border-border-light p-6 animate-pulse">
                  <div className="flex gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0"></div>
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded"></div>
                    <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="w-full py-16 px-6 bg-white border border-border-light rounded-lg flex flex-col items-center justify-center text-center">
              <svg className="w-16 h-16 text-text-muted mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <h3 className="text-lg font-bold text-text-primary mb-2">No se encontraron agentes</h3>
              <p className="text-sm text-text-secondary max-w-sm mb-6">
                Intenta ajustar o limpiar tus filtros para encontrar asesores de viaje calificados.
              </p>
              <button
                onClick={clearFilters}
                className="bg-brand-primary text-white font-semibold px-6 py-2.5 rounded-sm hover:bg-brand-hover transition-colors text-sm"
              >
                Restablecer todos los filtros
              </button>
            </div>
          ) : (
            /* Cuadrícula de Agentes */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-white rounded-lg border border-border-light shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-xl hover:border-brand-primary/30 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  {/* Encabezado de la Carta */}
                  <div className="p-6 pb-4 flex items-start gap-4">
                    {/* Contenedor Foto de Perfil */}
                    <div className="relative flex-shrink-0">
                      <UserAvatar
                        src={agent.photo}
                        name={agent.name}
                        size="lg"
                        partnerType={agent.partnerType}
                      />
                      {agent.availability === "Inmediata" && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-status-success border-2 border-white rounded-full" title="Disponible Hoy"></span>
                      )}
                    </div>

                    {/* Información Básica */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="text-lg font-bold text-text-primary group-hover:text-brand-primary transition-colors leading-snug truncate">
                          {agent.name}
                        </h2>
                        {agent.featured && (
                          <span className="inline-flex items-center bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200">
                            ★ DESTACADO
                          </span>
                        )}
                        {agent.partnerType === "b2b_agency_entity" ? (
                          <span className="inline-flex items-center bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-200">
                            🏢 EMPRESA / AGENCIA B2B
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                            💼 ASESOR INDEPENDIENTE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary font-medium leading-relaxed mt-1">
                        {agent.title}
                      </p>

                      {/* Calificación y Experiencia */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <div className="flex items-center text-amber-500 text-sm">
                          <span className="font-bold text-text-primary mr-1">{agent.rating.toFixed(1)}</span>
                          <span className="text-amber-400">★</span>
                        </div>
                        <span className="text-xs text-text-muted">•</span>
                        <span className="text-xs text-text-secondary font-medium">
                          {agent.reviewsCount} reseñas
                        </span>
                        <span className="text-xs text-text-muted">•</span>
                        <span className="text-xs text-brand-primary font-semibold">
                          {agent.experience} de exp.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detalle Cuerpo de la Carta */}
                  <div className="px-6 py-2 flex-1">
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 mb-4">
                      {agent.bio}
                    </p>

                    {/* Especialidades y Países */}
                    <div className="space-y-3">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">Especialidad</span>
                        <div className="flex flex-wrap gap-1.5">
                          {agent.specialties.map((spec) => (
                            <span
                              key={spec}
                              className="bg-brand-light text-brand-primary text-[10px] font-bold px-2 py-0.5 rounded-sm"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">Destinos autorizados</span>
                        <div className="flex flex-wrap gap-1.5">
                          {agent.countries.map((country) => (
                            <span
                              key={country}
                              className="bg-gray-100 text-text-secondary text-[10px] font-semibold px-2 py-0.5 rounded-sm border border-gray-200"
                            >
                              {country}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                   {/* Pie de la Carta / Acciones */}
                   <div className="p-6 pt-4 border-t border-border-light bg-background-main/50 flex gap-3">
                     <button
                       onClick={() => router.push(`/agents/${agent.id}`)}
                       className="flex-1 px-4 py-2 bg-white border border-border-light text-text-secondary hover:text-brand-primary hover:border-brand-primary text-xs font-semibold rounded-sm transition-all focus:outline-none flex items-center justify-center gap-1"
                     >
                       Ver Perfil
                     </button>

                      {(!user || (user.role !== "agent" && user.role !== "agency")) && (
                        <button
                          onClick={() => handleHireAgent(agent)}
                          disabled={Boolean(user?.hasPaidAdvisor)}
                          className={`flex-1 px-4 py-2 text-xs font-semibold rounded-sm transition-all focus:outline-none flex items-center justify-center gap-1.5 ${
                            user?.hasPaidAdvisor
                              ? "bg-gray-200 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none"
                              : "bg-brand-primary hover:bg-brand-hover text-white shadow-sm"
                          }`}
                        >
                          {user?.hasPaidAdvisor ? "Asesoría Contratada" : "Contratar Asesoría"}
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      {/* Checkout Modal */}
      {isCheckoutOpen && checkoutAgent && (
        <CheckoutModal
          agent={checkoutAgent}
          onClose={() => {
            setIsCheckoutOpen(false);
            setCheckoutAgent(null);
          }}
          onSuccess={() => {
            setIsCheckoutOpen(false);
            setCheckoutAgent(null);
            router.push("/profile?tab=asesor");
          }}
        />
      )}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-sm border shadow-xl animate-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success'
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
