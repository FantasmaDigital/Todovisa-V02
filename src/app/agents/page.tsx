"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import agentsData from "../dummies/agents.json";
import { useAuthStore } from "../store/authStore";
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
  
  // State for active modal agent
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

  // Checkout modal states
  const [checkoutAgent, setCheckoutAgent] = useState<Agent | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleHireAgent = (agent: Agent) => {
    if (!user) {
      showToast("Por favor, inicia sesión para poder contratar a este asesor.", "info");
      setTimeout(() => {
        router.push("/auth/signin");
      }, 1500);
      return;
    }
    
    if (user.hasPaidAdvisor) {
      showToast("Ya tienes contratada una asesoría activa. Redirigiendo a tu chat...", "info");
      setTimeout(() => {
        router.push("/profile?tab=asesor");
      }, 1500);
      return;
    }

    setCheckoutAgent(agent);
    setIsCheckoutOpen(true);
  };

  // Lists of unique values for filters
  const countries = ["Todos", "Estados Unidos", "Canadá", "México", "Inglaterra", "Australia"];
  const specialties = [
    "Todos",
    "Turismo",
    "Estudio",
    "Trabajo",
    "Negocios",
    "Inversión",
    "Renovación",
    "Preparación Consular",
    "Tránsito/Tripulante"
  ];
  const languages = ["Todos", "Español", "Inglés", "Francés", "Portugués"];
  const availabilities = ["Todos", "Inmediata", "Próxima semana"];

  // Filter logic
  const filteredAgents = (agentsData as Agent[]).filter((agent) => {
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
      <div className="w-full bg-brand-primary py-14 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="w-[80%] mx-auto relative z-10">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-3">Red TodoVisa</p>
          <h1 className="text-4xl md:text-5xl text-white leading-tight mb-4 font-semibold font-serif italic">
            Encuentra a tu agente certificado
          </h1>
          <p className="text-white/95 text-base md:text-lg max-w-2xl leading-relaxed">
            Te conectamos con los mejores asesores especializados. Elige al experto ideal para tu destino, tipo de visa e idioma y asegura un trámite sin contratiempos.
          </p>
        </div>
      </div>

      <main className="w-[80%] mx-auto py-12 flex-1 flex flex-col lg:flex-row gap-8">
        
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
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
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
                {specialties.map((specialty) => (
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
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang === "Todos" ? "Todos los idiomas" : lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Disponibilidad */}
            <div className="mb-2">
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
              Mostrando <span className="font-semibold text-text-primary">{filteredAgents.length}</span> agentes disponibles
            </p>
          </div>

          {/* Estado vacío si no hay resultados */}
          {filteredAgents.length === 0 ? (
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
                      <img
                        src={agent.photo}
                        alt={`Foto de ${agent.name}`}
                        className="w-16 h-16 rounded-full object-cover border border-border-light"
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
                  <div className="p-6 pt-4 border-t border-border-light bg-background-main/50 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveAgent(agent)}
                      className="px-4 py-2 bg-white border border-border-light text-text-secondary hover:text-brand-primary hover:border-brand-primary text-xs font-semibold rounded-sm transition-all focus:outline-none flex items-center justify-center gap-1"
                    >
                      Ver Perfil
                    </button>
                    
                    <button
                      onClick={() => handleHireAgent(agent)}
                      className="px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold rounded-sm transition-all focus:outline-none flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      Contratar Asesoría
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal de Detalle del Agente */}
      {activeAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col border border-border-light animate-in fade-in zoom-in-95 duration-200">
            
            {/* Botón de Cierre */}
            <button
              onClick={() => setActiveAgent(null)}
              className="absolute right-4 top-4 text-text-secondary hover:text-text-primary bg-background-main hover:bg-background-hover p-2 rounded-full transition-colors z-20 focus:outline-none"
              title="Cerrar"
            >
              <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Encabezado del Perfil */}
            <div className="p-8 bg-brand-light flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-border-light">
              <img
                src={activeAgent.photo}
                alt={`Foto de ${activeAgent.name}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md flex-shrink-0"
              />
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1.5">
                  <h2 className="text-2xl font-bold text-text-primary">{activeAgent.name}</h2>
                  {activeAgent.featured && (
                    <span className="mx-auto sm:mx-0 w-max bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                      ★ VERIFICADO
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-brand-primary mb-3">
                  {activeAgent.title}
                </p>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                  <div className="flex items-center text-amber-500 font-bold text-sm">
                    <span className="text-text-primary mr-1">{activeAgent.rating.toFixed(1)}</span>
                    <span className="text-amber-400 mr-1.5">★</span>
                    <span className="text-xs font-normal text-text-secondary">({activeAgent.reviewsCount} evaluaciones)</span>
                  </div>
                  <span className="hidden sm:inline text-text-muted">|</span>
                  <p className="text-xs font-medium text-text-secondary">
                    Experiencia: <span className="font-bold text-text-primary">{activeAgent.experience}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido del Perfil */}
            <div className="p-8 space-y-6">
              {/* Biografía */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Sobre mí</h4>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {activeAgent.bio}
                </p>
              </div>

              {/* Habilidades e Idiomas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-border-light">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2.5">Idiomas de asesoría</h4>
                  <div className="flex flex-wrap gap-2">
                    {activeAgent.languages.map((lang) => (
                      <span key={lang} className="bg-background-main border border-border-light text-text-secondary text-xs font-semibold px-3 py-1 rounded-sm">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2.5">Estado de disponibilidad</h4>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${activeAgent.availability === "Inmediata" ? "bg-status-success" : "bg-status-warning"}`}></span>
                    <span className="text-sm font-bold text-text-primary">
                      {activeAgent.availability === "Inmediata" ? "Agenda abierta (Cupos hoy)" : `Disponible la ${activeAgent.availability.toLowerCase()}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Especialidades por Visa y Destinos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2.5">Especialidad por tipo de visa</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeAgent.specialties.map((spec) => (
                      <span key={spec} className="bg-brand-light text-brand-primary text-xs font-bold px-2.5 py-1 rounded-sm">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2.5">Países y Embajadas que domina</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeAgent.countries.map((country) => (
                      <span key={country} className="bg-gray-100 text-text-secondary text-xs font-bold px-2.5 py-1 rounded-sm border border-gray-200">
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Flujo de trabajo con el agente */}
              <div className="pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">¿Cómo te ayuda tu asesor en TodoVisa?</h4>
                <div className="space-y-3.5">
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

            {/* Pie de Página del Modal */}
            <div className="p-8 border-t border-border-light bg-background-main/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="text-center sm:text-left">
                <p className="text-xs text-text-secondary font-medium">¿Listo para iniciar tu trámite?</p>
                <p className="text-sm font-bold text-text-primary">Conversa directamente con {activeAgent.name.split(" ")[1]}</p>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setActiveAgent(null)}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-border-light text-text-secondary hover:text-text-primary text-xs font-semibold rounded-sm transition-all focus:outline-none"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    const agentToHire = activeAgent;
                    setActiveAgent(null);
                    handleHireAgent(agentToHire);
                  }}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold rounded-sm transition-all focus:outline-none flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Contratar Asesoría
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
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
