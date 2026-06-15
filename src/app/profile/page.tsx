"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "next/navigation";
import { countries } from "countries-list";
import { CheckoutModal } from "../components/shared/CheckoutModal";
import agentsData from "../dummies/agents.json";

// Convert countries list to sorted array
const countriesArray = Object.entries(countries)
  .map(([code, data]: [string, any]) => ({
    code,
    name: data.name,
    dial: `+${typeof data.phone === 'string' ? data.phone.split(',')[0] : data.phone[0]}`
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function PerfilUsuarioPage() {
  const headerRef = useRef(null);
  const router = useRouter();
  const { user, setUser, clearUser } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("SV");
  
  // Notification state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  // Tab State: "datos", "proceso", "asesor", "pagos"
  const [activeTab, setActiveTab] = useState("datos");

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutAgent, setCheckoutAgent] = useState<any>(null);

  // Chat states
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Computed assigned agent
  const assignedAgent = (agentsData as any[]).find(a => a.id === user?.assignedAgentId) || agentsData[0];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync state when user store loads
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phone || "");
      setCountryCode(user.country || "SV");
    }
  }, [user]);

  // Read URL search params for active tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["datos", "proceso", "asesor", "pagos"].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  // Prepopulate messages on load or agent switch
  useEffect(() => {
    if (user) {
      const agentName = assignedAgent?.name || "Sofía Rodríguez";
      setMessages([
        {
          id: "msg-1",
          sender: "agent",
          text: `¡Hola, ${firstName || user.firstName || "cliente"}! Soy ${agentName}, tu asesora certificada asignada para tu trámite de visa a Estados Unidos.`,
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: "msg-2",
          sender: "agent",
          text: `He revisado el resultado de tu Evaluación Diagnóstica VIPRO (88/100, Favorable) y contamos con un perfil muy sólido. Sin embargo, debemos pulir los detalles del formulario DS-160 y prepararte bien para la entrevista.\n\n¿Qué día y hora te vendría bien para que programemos nuestra primera llamada por Zoom?`,
          timestamp: new Date(Date.now() - 3500000),
        }
      ]);
    }
  }, [user?.assignedAgentId, user?.id]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    if (activeTab === "asesor" && user?.hasPaidAdvisor) {
      scrollToBottom();
    }
  }, [messages, activeTab, user?.hasPaidAdvisor]);

  if (!isMounted) {
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

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-background-main">
        <Header headerRef={headerRef} />
        <main className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
          <div className="w-16 h-16 bg-brand-light text-brand-primary rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3">Acceso Restringido</h2>
          <p className="text-sm text-text-secondary mb-8 leading-relaxed">
            Debes iniciar sesión con tu cuenta para acceder a tu panel de control y ver tu perfil de usuario.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => router.push("/auth/signin")}
              className="w-full bg-brand-primary text-white font-semibold py-3 rounded-sm hover:bg-brand-hover transition-colors text-sm shadow-sm"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => router.push("/auth/signup")}
              className="w-full bg-white border border-border-light text-text-secondary font-semibold py-3 rounded-sm hover:text-text-primary hover:bg-background-hover transition-all text-sm"
            >
              Crear Cuenta
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSaveData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      alert("Por favor completa el nombre y apellido.");
      return;
    }

    setUser({
      ...user,
      firstName,
      lastName,
      phone,
      country: countryCode,
    });

    setNotificationMsg("¡Cambios guardados con éxito!");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 4000);
  };

  const handleLogout = () => {
    clearUser();
    router.push("/");
  };

  // Chat message send handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newUserMsg = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    const userText = inputValue.toLowerCase();
    setInputValue("");
    setIsTyping(true);

    // Dynamic, high-fidelity simulated typing from the advisor
    setTimeout(() => {
      let responseText = "";
      if (userText.includes("hola") || userText.includes("buenas") || userText.includes("buen")) {
        responseText = `¡Hola de nuevo, ${firstName}! Estoy atenta a tus mensajes. ¿Te gustaría que programemos nuestra primera llamada por Zoom para revisar tus documentos?`;
      } else if (userText.includes("documento") || userText.includes("requisito") || userText.includes("papel") || userText.includes("solvencia")) {
        responseText = "Para tu visa de turismo (B1/B2), necesitaremos preparar: Pasaporte vigente, confirmación del formulario DS-160, comprobante de pago de arancel consular ($185 USD) y pruebas de arraigo en El Salvador (como constancia de trabajo, estados de cuenta bancarios o títulos de propiedad). En nuestra primera sesión analizaremos cómo presentarlos de la mejor manera.";
      } else if (userText.includes("fecha") || userText.includes("cuando") || userText.includes("cita") || userText.includes("tiempo")) {
        responseText = "Las citas en la embajada se programan una vez que paguemos el arancel consular. Actualmente hay cierta lista de espera, pero monitoreo el sistema a diario para pescar citas adelantadas en el CAS. En nuestra reunión definiremos las mejores fechas posibles.";
      } else if (userText.includes("ds160") || userText.includes("ds-160") || userText.includes("formulario")) {
        responseText = "Yo me encargaré de auditar y rellenar tu formulario DS-160 con la información que recolectemos. Es de vital importancia que coincida exactamente con lo que diremos en la entrevista para evitar contradicciones.";
      } else if (userText.includes("gracias") || userText.includes("excelente") || userText.includes("perfecto")) {
        responseText = "¡Con gusto! Mi meta es que vayas al consulado con 100% de confianza. Avísame cuando estés listo para agendar la llamada.";
      } else {
        responseText = `Entendido, ${firstName}. Tomo nota de lo que me comentas. Voy a analizarlo para diseñar la estrategia ideal para tu perfil. ¿Prefieres que agendemos nuestra llamada de diagnóstico inicial para mañana en la tarde o prefieres el fin de semana?`;
      }

      const newAgentMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: "agent",
        text: responseText,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, newAgentMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background-main">
      <Header headerRef={headerRef} />

      {/* Banner Superior del Perfil */}
      <div className="w-full bg-brand-primary py-12 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="w-[80%] mx-auto flex flex-col md:flex-row items-center md:items-end gap-6 relative z-10">
          {/* Avatar gigante */}
          <div className="w-20 h-20 bg-brand-light border-4 border-white/20 rounded-full flex items-center justify-center shadow-lg text-white font-bold text-3xl select-none">
            {firstName.charAt(0).toUpperCase()}
          </div>
          
          <div className="text-center md:text-left text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75 mb-1.5">Panel del Aplicante</p>
            <h1 className="text-3xl font-bold leading-tight font-serif italic mb-1">
              Hola, {firstName} {lastName}
            </h1>
            <p className="text-xs text-white/90 font-medium">
              ID de Usuario: <span className="font-mono text-white/70">{user.id.substring(0, 8)}...</span> • Registrado desde El Salvador
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="md:ml-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-sm border border-white/20 transition-colors focus:outline-none flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Alerta de Éxito */}
      {showNotification && (
        <div className="w-[80%] mx-auto mt-6">
          <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold">{notificationMsg}</span>
          </div>
        </div>
      )}

      {/* Grid Principal */}
      <main className="w-[80%] mx-auto py-10 flex-1 flex flex-col lg:flex-row gap-8">
        
        {/* Columna Izquierda: Tarjeta de Resumen y Menú */}
        <aside className="w-full lg:w-1/4 flex-shrink-0">
          <div className="bg-white rounded-lg border border-border-light overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            
            {/* Info rápida */}
            <div className="p-6 text-center border-b border-border-light bg-background-main/30">
              <div className="w-16 h-16 bg-brand-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-bold text-text-primary text-md leading-snug">{firstName} {lastName}</h3>
              <p className="text-xs text-text-secondary mt-1">{user.email}</p>
              
              <div className="mt-4 inline-flex items-center gap-1.5 bg-brand-light text-brand-primary text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100">
                <span className="w-1.5 h-1.5 bg-brand-primary rounded-full"></span>
                EVALUACIÓN VIPRO COMPLETADA
              </div>
            </div>

            {/* Navegación Vertical */}
            <nav className="p-2 flex flex-col gap-1">
              {[
                { id: "datos", label: "Mis Datos Personales", icon: "👤" },
                { id: "proceso", label: "Seguimiento de Trámite", icon: "✈️" },
                { id: "asesor", label: "Mi Asesor Asignado", icon: "🤝" },
                { id: "pagos", label: "Pagos y Comprobantes", icon: "💳" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-sm text-left transition-colors focus:outline-none ${
                    activeTab === tab.id
                      ? "bg-brand-light text-brand-primary font-semibold"
                      : "text-text-secondary hover:bg-background-hover hover:text-text-primary"
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Columna Derecha: Contenido del Tab Activo */}
        <section className="w-full lg:w-3/4">
          <div className="bg-white rounded-lg border border-border-light p-6 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.01)] min-h-[450px]">
            
            {/* TAB: DATOS PERSONALES */}
            {activeTab === "datos" && (
              <div>
                <div className="mb-6 pb-4 border-b border-border-light">
                  <h2 className="text-lg font-bold text-text-primary">Datos Personales</h2>
                  <p className="text-xs text-text-secondary mt-1">Mantén tu información de contacto actualizada para que podamos ponernos en contacto contigo.</p>
                </div>

                <form onSubmit={handleSaveData} className="max-w-xl space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Nombres</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-all text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Apellidos</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-all text-text-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Correo Electrónico</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-3 py-2 bg-gray-100 border border-border-light rounded-sm text-sm text-text-muted cursor-not-allowed"
                    />
                    <span className="block text-[10px] text-text-muted mt-1">El correo electrónico no puede ser modificado por seguridad.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Teléfono móvil</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej. +503 7000-0000"
                        className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus focus:ring-1 focus:ring-border-focus transition-all text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">País de Residencia</label>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-full px-3 py-2 bg-background-main border border-border-light rounded-sm text-sm focus:border-border-focus transition-all text-text-primary"
                      >
                        {countriesArray.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="bg-brand-primary text-white font-semibold px-6 py-2.5 rounded-sm hover:bg-brand-hover transition-colors text-sm shadow-sm"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: SEGUIMIENTO DE TRÁMITE */}
            {activeTab === "proceso" && (
              <div>
                <div className="mb-6 pb-4 border-b border-border-light">
                  <h2 className="text-lg font-bold text-text-primary">Seguimiento de Trámite de Visa</h2>
                  <p className="text-xs text-text-secondary mt-1">Monitorea el avance de tu expediente consular paso a paso.</p>
                </div>

                {/* Timeline */}
                <div className="space-y-8 relative before:absolute before:inset-0 before:left-3.5 before:right-auto before:w-0.5 before:bg-gray-200 mt-4">
                  {/* Paso 1 */}
                  <div className="flex gap-4 relative">
                    <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm z-10 flex-shrink-0">
                      ✓
                    </div>
                    <div className="flex-1 bg-background-main/30 border border-border-light rounded-md p-4">
                      <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                        <h4 className="text-sm font-bold text-text-primary">Paso 1: Creación de perfil y verificación</h4>
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">COMPLETADO</span>
                      </div>
                      <p className="text-xs text-text-secondary">Tu cuenta ha sido creada exitosamente en TodoVisa y tu perfil está verificado.</p>
                    </div>
                  </div>

                  {/* Paso 2 */}
                  <div className="flex gap-4 relative">
                    <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm z-10 flex-shrink-0">
                      ✓
                    </div>
                    <div className="flex-1 bg-background-main/30 border border-border-light rounded-md p-4">
                      <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                        <h4 className="text-sm font-bold text-text-primary">Paso 2: Evaluación Diagnóstica VIPRO</h4>
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">CALIFICADO</span>
                      </div>
                      <p className="text-xs text-text-secondary">Evaluación realizada con éxito para destino: <span className="font-semibold text-text-primary">Estados Unidos</span>.</p>
                      <div className="mt-3 flex items-center gap-3 bg-brand-light/50 border border-blue-100 rounded p-2.5 w-max">
                        <span className="text-lg">📊</span>
                        <div>
                          <p className="text-xs font-bold text-brand-primary">Puntaje Obtenido: 88/100 (Favorable)</p>
                          <p className="text-[10px] text-text-secondary">Tu perfil cuenta con alta probabilidad. Recomendado continuar con llenado de DS-160.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Paso 3 */}
                  <div className="flex gap-4 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${
                      user.hasPaidAdvisor ? "bg-brand-primary text-white" : "bg-amber-500 text-white animate-pulse"
                    }`}>
                      {user.hasPaidAdvisor ? "✓" : "3"}
                    </div>
                    <div className={`flex-1 rounded-md p-4 border ${
                      user.hasPaidAdvisor ? "bg-background-main/30 border-border-light" : "bg-white border-amber-200 shadow-sm"
                    }`}>
                      <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                        <h4 className="text-sm font-bold text-text-primary">Paso 3: Asignación de Agente Consular</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          user.hasPaidAdvisor 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}>
                          {user.hasPaidAdvisor ? "COMPLETADO" : "ACCION REQUERIDA"}
                        </span>
                      </div>
                      
                      {user.hasPaidAdvisor ? (
                        <div>
                          <p className="text-xs text-text-secondary">
                            Has asignado correctamente a tu asesor: <span className="font-semibold text-text-primary">{assignedAgent.name}</span>.
                          </p>
                          <button
                            onClick={() => setActiveTab("asesor")}
                            className="mt-3 bg-brand-primary text-white font-semibold px-4 py-2 rounded-sm hover:bg-brand-hover transition-colors text-xs inline-flex items-center gap-1.5 focus:outline-none"
                          >
                            <span>Ir a mi Chat de Soporte</span>
                            <span>💬</span>
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-text-secondary mb-3">Debes seleccionar un agente virtual certificado para iniciar el armado de tu expediente y simulación.</p>
                          <button
                            onClick={() => router.push("/agents")}
                            className="bg-brand-primary text-white font-semibold px-4 py-2 rounded-sm hover:bg-brand-hover transition-colors text-xs inline-flex items-center gap-1 focus:outline-none"
                          >
                            <span>Elegir Agente Ahora</span>
                            <span>&rarr;</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Paso 4 */}
                  <div className={`flex gap-4 relative transition-all ${user.hasPaidAdvisor ? "" : "opacity-60"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 flex-shrink-0 ${
                      user.hasPaidAdvisor ? "bg-amber-500 text-white animate-pulse" : "bg-gray-200 text-text-muted"
                    }`}>
                      {user.hasPaidAdvisor ? "4" : "4"}
                    </div>
                    <div className={`flex-1 border rounded-md p-4 ${
                      user.hasPaidAdvisor ? "bg-white border-amber-200 shadow-sm" : "bg-background-main/50 border-border-light"
                    }`}>
                      <div className="flex justify-between items-start mb-1 flex-wrap gap-2">
                        <h4 className={`text-sm font-bold ${user.hasPaidAdvisor ? "text-text-primary" : "text-text-secondary"}`}>
                          Paso 4: Armado de Expediente y Formulario Consular
                        </h4>
                        {user.hasPaidAdvisor && (
                          <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 animate-pulse">
                            EN PROGRESO
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${user.hasPaidAdvisor ? "text-text-secondary" : "text-text-muted"}`}>
                        Llenado digital del formulario de visa y preparación de documentos de solvencia económica. Tu asesor te dará pautas por chat.
                      </p>
                    </div>
                  </div>

                  {/* Paso 5 */}
                  <div className="flex gap-4 relative opacity-60">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-text-muted flex items-center justify-center font-bold text-sm z-10 flex-shrink-0">
                      5
                    </div>
                    <div className="flex-1 bg-background-main/50 border border-border-light rounded-md p-4">
                      <h4 className="text-sm font-bold text-text-secondary mb-1">Paso 5: Programación de Cita y Simulacro Consular</h4>
                      <p className="text-xs text-text-muted">Obtención de fechas en el CAS / Embajada y entrenamiento intensivo con tu asesor.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MI ASESOR */}
            {activeTab === "asesor" && (
              <div>
                <div className="mb-6 pb-4 border-b border-border-light">
                  <h2 className="text-lg font-bold text-text-primary">Tu Asesor Consular Asignado</h2>
                  <p className="text-xs text-text-secondary mt-1">Aquí verás al experto que guiará todo tu proceso de visado.</p>
                </div>

                {user.hasPaidAdvisor ? (
                  // CHAT APARTADO: Chat con el Asesor
                  <div className="space-y-6">
                    {/* Advisor Info Bar */}
                    <div className="bg-white rounded-lg border border-border-light p-4 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-brand-primary/20 transition-all flex flex-col sm:flex-row items-center gap-4">
                      <img
                        src={assignedAgent.photo}
                        alt={assignedAgent.name}
                        className="w-14 h-14 rounded-full object-cover border border-border-light flex-shrink-0"
                      />
                      <div className="text-center sm:text-left flex-1">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <h5 className="font-bold text-text-primary text-sm">{assignedAgent.name}</h5>
                          <span className="bg-amber-50 text-amber-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-amber-100">ASIGNADO</span>
                        </div>
                        <p className="text-xs text-brand-primary font-semibold mt-0.5">{assignedAgent.title}</p>
                        <p className="text-[11px] text-text-secondary mt-1">Soporte Inmediato • ⭐ {assignedAgent.rating.toFixed(1)} ({assignedAgent.reviewsCount} reseñas)</p>
                      </div>
                    </div>

                    {/* Chat Window */}
                    <div className="border border-border-light rounded-lg overflow-hidden flex flex-col h-[500px] bg-background-main/20 shadow-inner">
                      {/* Chat Header */}
                      <div className="bg-white px-5 py-4 border-b border-border-light flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={assignedAgent.photo}
                              alt={assignedAgent.name}
                              className="w-10 h-10 rounded-full object-cover border border-border-light"
                            />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-status-success border-2 border-white rounded-full"></span>
                          </div>
                          <div>
                            <h4 className="font-bold text-text-primary text-sm leading-tight">{assignedAgent.name}</h4>
                            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                              En línea • Asesor TodoVisa
                            </p>
                          </div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <span className="text-[10px] text-text-muted font-mono bg-brand-light text-brand-primary px-2.5 py-1 rounded font-bold">
                            CONTRATO ACTIVO
                          </span>
                        </div>
                      </div>

                      {/* Messages Box */}
                      <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {messages.map((msg) => {
                          const isSelf = msg.sender === "user";
                          return (
                            <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                              <div className={`flex gap-2.5 max-w-[80%] ${isSelf ? "flex-row-reverse" : "flex-row"}`}>
                                {!isSelf && (
                                  <img
                                    src={assignedAgent.photo}
                                    alt={assignedAgent.name}
                                    className="w-8 h-8 rounded-full object-cover border border-border-light flex-shrink-0"
                                  />
                                )}
                                <div className="flex flex-col">
                                  <div className={`rounded-lg px-4 py-2.5 text-sm ${
                                    isSelf 
                                      ? "bg-brand-primary text-white rounded-tr-none" 
                                      : "bg-white border border-border-light text-text-primary rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                  }`}>
                                    <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                                  </div>
                                  <span className={`text-[9px] text-text-muted mt-1 ${isSelf ? "text-right" : "text-left"}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="flex gap-2.5 max-w-[80%]">
                              <img
                                src={assignedAgent.photo}
                                alt={assignedAgent.name}
                                className="w-8 h-8 rounded-full object-cover border border-border-light flex-shrink-0 animate-pulse"
                              />
                              <div className="bg-white border border-border-light text-text-primary rounded-lg rounded-tl-none px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input Form */}
                      <form onSubmit={handleSendMessage} className="bg-white p-3 border-t border-border-light flex gap-2">
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder={`Escribe un mensaje a ${assignedAgent.name.split(" ")[1]}...`}
                          disabled={isTyping}
                          className="flex-1 bg-background-main border border-border-light rounded-sm px-4 py-2.5 text-sm focus:border-border-focus focus:outline-none text-text-primary placeholder:text-text-muted disabled:bg-gray-50"
                        />
                        <button
                          type="submit"
                          disabled={!inputValue.trim() || isTyping}
                          className="bg-brand-primary text-white font-semibold px-5 rounded-sm hover:bg-brand-hover transition-colors text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          <span>Enviar</span>
                          <span>✈️</span>
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  // UNPAID STATE: Prompt to pay, no WhatsApp link
                  <div>
                    {/* Not assigned yet prompt */}
                    <div className="bg-brand-light/40 border border-brand-primary/20 rounded-md p-6 flex flex-col sm:flex-row items-center gap-5">
                      <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center flex-shrink-0 text-brand-primary">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                      </div>
                      <div className="text-center sm:text-left flex-1">
                        <h3 className="font-bold text-text-primary text-sm mb-1">Aún no tienes un asesor contratado</h3>
                        <p className="text-xs text-text-secondary leading-relaxed mb-4 max-w-lg">
                          Para acceder al chat interno de comunicación directa y videollamadas con tu especialista asignado, debes contratar la asesoría consular.
                        </p>
                        <button
                          onClick={() => router.push("/agents")}
                          className="bg-brand-primary text-white font-semibold px-5 py-2.5 rounded-sm hover:bg-brand-hover transition-colors text-xs focus:outline-none"
                        >
                          Explorar red de agentes certificados
                        </button>
                      </div>
                    </div>

                    {/* Recommended Agent Card (Pagar button instead of WhatsApp link) */}
                    <div className="mt-8">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Recomendado según tu perfil</h4>
                      <div className="bg-white rounded-lg border border-border-light p-5 flex flex-col sm:flex-row items-center gap-4 max-w-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-brand-primary/20 transition-all">
                        <img
                          src={assignedAgent.photo}
                          alt={assignedAgent.name}
                          className="w-14 h-14 rounded-full object-cover border border-border-light flex-shrink-0"
                        />
                        <div className="text-center sm:text-left flex-1">
                          <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <h5 className="font-bold text-text-primary text-sm">{assignedAgent.name}</h5>
                            <span className="bg-amber-50 text-amber-700 text-[8px] font-bold px-1 py-0.5 rounded border border-amber-100">RECOMENDADO</span>
                          </div>
                          <p className="text-xs text-brand-primary font-semibold mt-0.5">{assignedAgent.title}</p>
                          <p className="text-[11px] text-text-secondary mt-1">Disponibilidad Inmediata • ⭐ {assignedAgent.rating.toFixed(1)} ({assignedAgent.reviewsCount} reseñas)</p>
                        </div>
                        
                        <button
                          onClick={() => {
                            setCheckoutAgent(assignedAgent);
                            setIsCheckoutOpen(true);
                          }}
                          className="px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold rounded-sm transition-all focus:outline-none flex items-center justify-center gap-1 flex-shrink-0 shadow-sm"
                        >
                          <span>Pagar Asesoría</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PAGOS Y COMPROBANTES */}
            {activeTab === "pagos" && (
              <div>
                <div className="mb-6 pb-4 border-b border-border-light">
                  <h2 className="text-lg font-bold text-text-primary">Historial de Transacciones</h2>
                  <p className="text-xs text-text-secondary mt-1">Revisa el detalle de tus compras de servicios y descarga tus comprobantes.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border-light text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-background-main/40">
                        <th className="py-3 px-4">Referencia</th>
                        <th className="py-3 px-4">Concepto</th>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4">Monto</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light text-xs">
                      {/* Fila 1: VIPRO Evaluation (Siempre pagada) */}
                      <tr>
                        <td className="py-4 px-4 font-mono font-medium text-text-primary">TV-VIPRO-8429</td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-bold text-text-primary">Evaluación VIPRO Diagnóstica</p>
                            <p className="text-[10px] text-text-secondary">Destino: Estados Unidos</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-text-secondary">14 Jun, 2026</td>
                        <td className="py-4 px-4 font-bold text-text-primary">$19.99 USD</td>
                        <td className="py-4 px-4">
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-100">
                            PAGADO
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => alert("Generando PDF de factura...")}
                            className="text-brand-primary hover:underline hover:text-brand-hover font-semibold transition-colors"
                          >
                            Descargar
                          </button>
                        </td>
                      </tr>
                      
                      {/* Fila 2: Premium Advisory (Depende de hasPaidAdvisor) */}
                      <tr className={user.hasPaidAdvisor ? "" : "opacity-90"}>
                        <td className="py-4 px-4 font-mono font-medium text-text-primary">TV-ASES-3820</td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-bold text-text-primary">Asesoría de Visa Premium (Completa)</p>
                            <p className="text-[10px] text-text-secondary">Destino: Estados Unidos</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-text-secondary">14 Jun, 2026</td>
                        <td className="py-4 px-4 font-bold text-text-primary">
                          {user.hasPaidAdvisor ? "$112.50 USD" : "$150.00 USD"}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            user.hasPaidAdvisor 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                              : "bg-amber-50 text-amber-800 border-amber-100"
                          }`}>
                            {user.hasPaidAdvisor ? "PAGADO" : "PENDIENTE"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {user.hasPaidAdvisor ? (
                            <button
                              onClick={() => setActiveTab("asesor")}
                              className="text-brand-primary hover:underline font-semibold"
                            >
                              Ver Chat
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setCheckoutAgent(assignedAgent);
                                setIsCheckoutOpen(true);
                              }}
                              className="bg-brand-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-sm hover:bg-brand-hover transition-colors shadow-sm"
                            >
                              Pagar
                            </button>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 bg-brand-light/30 border border-brand-primary/10 rounded-md p-5 flex items-start gap-4">
                  <span className="text-xl">💡</span>
                  <div>
                    <h5 className="font-bold text-text-primary text-xs mb-1">Garantía de Aprobación de Descuento</h5>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      Como completaste tu evaluación VIPRO de $19.99 USD, tienes activo un cupón del <span className="font-bold text-brand-primary">25% de descuento</span> aplicable a cualquier trámite de asesoría formal con nuestros agentes de la red. ¡Contáctalos para aplicarlo!
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

      </main>

      <Footer />

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
            setActiveTab("asesor");
            setNotificationMsg("¡Asesor contratado y chat activado con éxito!");
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 5000);
          }}
        />
      )}
    </div>
  );
}
