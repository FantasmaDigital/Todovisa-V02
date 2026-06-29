"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { Header } from "../../components/shared/Header";
import { Footer } from "../../components/shared/Footer";
import { useSearchParams, useRouter } from "next/navigation";
import supabase from "../../lib/supabase";

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
}

function AgentPortalContent() {
  const headerRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

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

  // Manual lookup input
  const [lookupId, setLookupId] = useState("");

  // Signature state
  const [termsChecked, setTermsChecked] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [signing, setSigning] = useState(false);

  // Admin mock states
  const [approving, setApproving] = useState(false);

  // Earnings Simulator state
  const [touristCases, setTouristCases] = useState(6);
  const [studentCases, setStudentCases] = useState(3);
  const [simRating, setSimRating] = useState(4.8);

  // Onboarding Checklist
  const [onboardingSteps, setOnboardingSteps] = useState({
    training: true,
    payment: false,
    app: false,
    mockRun: false,
  });

  const fetchAgent = async (appId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from("agent_applications")
        .select("*")
        .eq("application_id", appId.trim().toUpperCase())
        .single();

      if (fetchErr) {
        throw new Error(
          fetchErr.code === "PGRST116"
            ? "No se encontró ninguna postulación con el Folio provisto. Por favor verifique el código."
            : fetchErr.message
        );
      }

      setAgent(data);
      if (data.full_name) {
        setSignatureName(data.full_name);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (idParam) {
        fetchAgent(idParam);
      } else {
        setLoading(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [idParam]);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    router.push(`/agents/portal?id=${lookupId.trim().toUpperCase()}`);
  };

  // Mock Admin Action: Approve the application
  const simulateApproval = async () => {
    if (!agent) return;
    setApproving(true);
    try {
      if (agent.is_local) {
        const updated = { ...agent, status: "approved" as const };
        localStorage.setItem(`agent_app_${agent.application_id}`, JSON.stringify(updated));
        setAgent(updated);
        showToast("¡Perfil Aprobado (Local)! Ahora puedes revisar y firmar el contrato legal.", "success");
      } else {
        const { error: updateErr } = await supabase
          .from("agent_applications")
          .update({ status: "approved" })
          .eq("application_id", agent.application_id);

        if (updateErr) throw new Error(updateErr.message);

        setAgent((prev) => (prev ? { ...prev, status: "approved" } : null));
        showToast("¡Perfil Aprobado! Ahora puedes revisar y firmar el contrato legal.", "success");
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      showToast("Error al actualizar estado: " + errMessage, "error");
    } finally {
      setApproving(false);
    }
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
        const { error: updateErr } = await supabase
          .from("agent_applications")
          .update({
            status: "active",
            signature_name: signatureName,
            signed_at: nowString,
          })
          .eq("application_id", agent.application_id);

        if (updateErr) throw new Error(updateErr.message);

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
  const getCommissionRate = () => (simRating >= 4.8 ? 0.8 : 0.7);
  const getGrossEarnings = () => touristCases * 150 + studentCases * 250;
  const getAgentShare = () => getGrossEarnings() * getCommissionRate();
  const getPlatformFee = () => getAgentShare() * 0.05;
  const getNetEarnings = () => getAgentShare() - getPlatformFee();

  return (
    <div className="min-h-screen w-full flex flex-col bg-background-main font-sans">
      <Header headerRef={headerRef} />

      {/* Hero Banner */}
      <div className="w-full bg-[#0a2336] text-white py-12 px-6 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="w-[80%] mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-emerald-400 uppercase mb-2">Portal de Agentes TodoVisa</p>
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

      <main className="w-[80%] mx-auto py-10 flex-1 flex flex-col gap-8">
        {agent && agent.is_local && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-sm text-amber-900 text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <span className="flex items-center gap-2">
              <span>⚠️</span>
              <span><strong>Modo de Respaldo Local Activo:</strong> No se pudo establecer conexión con Supabase. Tu contrato y progreso se están guardando de forma segura en la memoria local de tu navegador.</span>
            </span>
          </div>
        )}
        {/* NO ID OR LOOKUP SCREEN */}
        {!idParam && (
          <div className="max-w-md mx-auto w-full bg-white border border-border-light rounded-sm p-8 text-center my-10 shadow-sm">
            <span className="text-4xl">📄</span>
            <h3 className="text-lg font-bold text-text-primary mt-4 mb-2">Consultar Estado de Contrato</h3>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
              Ingresa el Folio de tu postulación (ej. TDA-123456) para ver tu estado, firmar el acuerdo o abrir tu panel.
            </p>
            <form onSubmit={handleLookupSubmit} className="space-y-4">
              <input
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="TDA-XXXXXX"
                className="w-full text-center px-4 py-3 bg-background-main border border-border-light rounded-sm text-sm font-mono focus:border-border-focus focus:outline-none transition-all placeholder:text-text-muted"
                required
              />
              <button
                type="submit"
                className="w-full py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-colors cursor-pointer"
              >
                Buscar Expediente
              </button>
            </form>
          </div>
        )}

        {/* LOADING STATE */}
        {idParam && loading && (
          <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-text-secondary font-medium">Buscando expediente en la base de datos...</span>
          </div>
        )}

        {/* ERROR STATE */}
        {idParam && !loading && error && (
          <div className="max-w-md mx-auto w-full bg-white border border-red-200 rounded-sm p-8 text-center my-10 shadow-sm">
            <span className="text-4xl text-red-500">⚠️</span>
            <h3 className="text-lg font-bold text-text-primary mt-4 mb-2">Error de Búsqueda</h3>
            <p className="text-xs text-red-600 mb-6 leading-relaxed">{error}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setError(null);
                  if (idParam) fetchAgent(idParam);
                }}
                className="w-full py-2 bg-brand-primary text-white text-xs font-bold rounded-sm hover:bg-brand-hover cursor-pointer"
              >
                Reintentar
              </button>
              <button
                onClick={() => router.push("/agents/portal")}
                className="w-full py-2 bg-white border border-border-light text-text-secondary text-xs font-bold rounded-sm hover:bg-background-hover cursor-pointer"
              >
                Consultar otro Folio
              </button>
            </div>
          </div>
        )}

        {/* AGENT PORTAL WORKFLOW STATES */}
        {idParam && !loading && agent && (
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

                  {/* Testing Simulation Box */}
                  <div className="bg-brand-light/35 border border-brand-primary/20 rounded-sm p-6 space-y-4">
                    <div>
                      <span className="bg-brand-primary text-white text-[8px] font-bold px-2 py-0.5 rounded tracking-wide">MOCK TESTING DE ADMINISTRACIÓN</span>
                      <h3 className="text-md font-bold text-text-primary mt-2">Simular Aprobación de TodoVisa</h3>
                      <p className="text-xs text-text-secondary mt-1">
                        Dado que estás en modo de demostración, puedes omitir la espera de 3 días y aprobar este perfil de inmediato haciendo clic en el botón de abajo. Esto actualizará el estado de la postulación en la base de datos de Supabase.
                      </p>
                    </div>
                    <button
                      onClick={simulateApproval}
                      disabled={approving}
                      className="px-5 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-all focus:outline-none flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {approving ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Actualizando Supabase...
                        </>
                      ) : (
                        "Aprobar Perfil Ahora ✓"
                      )}
                    </button>
                  </div>

                  {/* Submission Details Summary */}
                  <div className="bg-white border border-border-light rounded-sm p-6 sm:p-8">
                    <h3 className="text-md font-bold text-text-primary mb-6 pb-2 border-b border-border-light">Resumen del Expediente Enviado</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-text-secondary">
                      <div>
                        <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-1">Nombre Completo</span>
                        <p>{agent.full_name}</p>
                      </div>
                      <div>
                        <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-1">Email</span>
                        <p>{agent.email}</p>
                      </div>
                      <div>
                        <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-1">Teléfono</span>
                        <p>{agent.phone}</p>
                      </div>
                      <div>
                        <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-1">Años de Experiencia</span>
                        <p>{agent.experience_years} Años</p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="block font-bold text-text-primary uppercase text-[9px] tracking-wider mb-1">Biografía Breve</span>
                        <p className="leading-relaxed">{agent.biography}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 2: APPROVED / PENDING CONTRACT SIGNATURE */}
              {agent.status === "approved" && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-6 flex items-start gap-4">
                    <span className="text-2xl mt-0.5">🎉</span>
                    <div>
                      <h4 className="font-bold text-emerald-800 text-sm">¡Postulación Aprobada con Éxito!</h4>
                      <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                        Felicidades, tu perfil ha superado las validaciones técnicas. Hemos redactado tu acuerdo comercial. Por favor, lee los términos del contrato comercial a continuación, proporciona tu firma electrónica digital y acéptalo para comenzar.
                      </p>
                    </div>
                  </div>

                  {/* The Contract Document */}
                  <div className="bg-white border border-border-light rounded-sm shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-gray-50 border-b border-border-light px-6 py-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">CONTRATO_AGENTE_TODOVISA.pdf</span>
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold px-2 py-0.5 rounded">PENDIENTE DE FIRMA</span>
                    </div>

                    {/* Scrollable contract text */}
                    <div className="p-6 md:p-8 max-h-[350px] overflow-y-auto space-y-6 text-xs text-text-secondary leading-relaxed bg-[#fafafa] border-b border-border-light font-mono scrollbar-thin">
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
                          <li><strong>Comisión Base (70%):</strong> El Agente percibirá el setenta por ciento (70%) neto de la tarifa de asesoría cobrada oficialmente al cliente a través de la pasarela de TodoVisa.</li>
                          <li><strong>Bono de Excelencia (10% adicional):</strong> La Plataforma otorgará un bono extra del diez por ciento (10%), ascendiendo al ochenta por ciento (80%) total de comisión, cuando el Agente promedie una calificación de satisfacción de 4.8/5.0 estrellas en el mes.</li>
                          <li><strong>Tarifa de Plataforma (5% retención):</strong> La Plataforma retendrá un cinco por ciento (5%) de la comisión del Agente para solventar costos operativos de facturación, pasarela de cobros segura, uso de servidores y herramientas de asistencia.</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-text-primary uppercase text-[10px] mb-1">CLÁUSULA TERCERA: MÉTODOS Y CICLO DE PAGO</h4>
                        <p>
                          Las comisiones correspondientes a los trámites marcados como &quot;Cerrados y Aprobados por el Cliente&quot; serán acumuladas semanalmente. TodoVisa efectuará el pago al Agente cada día <strong>Viernes hábil</strong> mediante transferencia bancaria (ACH) o el procesador de pagos registrado en su perfil.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-text-primary uppercase text-[10px] mb-1">CLÁUSULA CUARTA: CONFIDENCIALIDAD DE DATOS</h4>
                        <p>
                          El Agente reconoce que tendrá acceso a datos altamente sensibles (números de pasaportes, datos financieros, actas de nacimiento y biografías). Se obliga a no divulgar, guardar copias externas, vender o utilizar estos datos para fines ajenos al trámite migratorio del cliente asignado. Cualquier filtración será causal de baja inmediata y acciones legales según la Ley de Protección de Datos de El Salvador.
                        </p>
                      </div>
                    </div>

                    {/* Signature Form */}
                    <form onSubmit={signContract} className="p-6 space-y-5 bg-white">
                      <div className="flex items-start gap-3">
                        <input
                          id="terms"
                          type="checkbox"
                          checked={termsChecked}
                          onChange={(e) => setTermsChecked(e.target.checked)}
                          className="mt-1 w-4 h-4 border border-border-light text-brand-primary rounded-sm focus:ring-brand-primary"
                        />
                        <label htmlFor="terms" className="text-xs text-text-secondary leading-normal cursor-pointer select-none">
                          He leído en su totalidad y de conformidad, <strong>acepto los términos comerciales</strong>, las comisiones financieras del 70% (con posibilidad de 80% por bono de excelencia) y las cláusulas penales por incumplimiento de confidencialidad de datos.
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end pt-2">
                        <div>
                          <label htmlFor="signature-input" className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                            Firma Legal Digital (Escribe tu Nombre Completo)
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
                            "✍️ Firmar y Activar Contrato"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* STATE 3: ACTIVE CONTRACT AND EARNINGS DASHBOARD */}
              {agent.status === "active" && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-6 flex items-start gap-4">
                    <span className="text-2xl mt-0.5">✅</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-emerald-800 text-sm">Contrato Activo e Incorporado</h4>
                      <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                        Tu estatus como Agente de la Red TodoVisa está activo. Tu perfil público ya es visible para los solicitantes de visado. Abajo puedes monitorear tus metas semanales de ganancias.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                          CONTRATO FIRMADO DIGITALMENTE POR: {agent.signature_name}
                        </span>
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                          FECHA: {agent.signed_at ? new Date(agent.signed_at).toLocaleString() : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* EARNINGS SIMULATOR */}
                  <div className="bg-white border border-border-light rounded-sm p-6 sm:p-8">
                    <div className="mb-6 pb-2 border-b border-border-light">
                      <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Plan Financiero</span>
                      <h3 className="text-lg font-bold text-text-primary mt-1">Simulador de Comisiones Semanales</h3>
                      <p className="text-xs text-text-secondary mt-1">
                        Estima cuánto ganarás según el número de expedientes que aprueben los clientes que asesores.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Controls Panel */}
                      <div className="space-y-5">
                        {/* Tourist Cases Input */}
                        <div>
                          <div className="flex justify-between items-center mb-1 text-xs">
                            <span className="font-semibold text-text-primary">Casos de Visa de Turista</span>
                            <span className="font-bold text-brand-primary font-mono">{touristCases} casos</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="25"
                            value={touristCases}
                            onChange={(e) => setTouristCases(parseInt(e.target.value))}
                            className="w-full accent-brand-primary"
                          />
                          <span className="text-[9px] text-text-muted">Retribución base por caso cerrado: $150 USD</span>
                        </div>

                        {/* Student Cases Input */}
                        <div>
                          <div className="flex justify-between items-center mb-1 text-xs">
                            <span className="font-semibold text-text-primary">Casos de Estudiante / Trabajo</span>
                            <span className="font-bold text-brand-primary font-mono">{studentCases} casos</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="15"
                            value={studentCases}
                            onChange={(e) => setStudentCases(parseInt(e.target.value))}
                            className="w-full accent-brand-primary"
                          />
                          <span className="text-[9px] text-text-muted">Retribución base por caso cerrado: $250 USD</span>
                        </div>

                        {/* Customer Rating Rating */}
                        <div>
                          <div className="flex justify-between items-center mb-1 text-xs">
                            <span className="font-semibold text-text-primary">Calificación de Satisfacción</span>
                            <span className="font-bold font-mono flex items-center gap-1">
                              ⭐ <span className={simRating >= 4.8 ? "text-emerald-600 font-bold" : "text-amber-600"}>{simRating.toFixed(1)}</span>
                            </span>
                          </div>
                          <input
                            type="range"
                            min="3.0"
                            max="5.0"
                            step="0.1"
                            value={simRating}
                            onChange={(e) => setSimRating(parseFloat(e.target.value))}
                            className="w-full accent-brand-primary"
                          />
                          <div className="flex justify-between text-[9px] text-text-muted mt-1">
                            <span>Mínimo 3.0</span>
                            <span className={simRating >= 4.8 ? "text-emerald-600 font-bold" : ""}>Bono Excelencia (&gt;= 4.8)</span>
                            <span>Máximo 5.0</span>
                          </div>
                        </div>
                      </div>

                      {/* Display Panel */}
                      <div className="bg-background-main border border-border-light rounded p-5 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex justify-between text-xs text-text-secondary border-b border-border-light pb-2">
                            <span>Facturación Bruta Asesorada</span>
                            <span className="font-mono font-semibold text-text-primary">${getGrossEarnings().toFixed(2)} USD</span>
                          </div>

                          <div className="flex justify-between text-xs text-text-secondary border-b border-border-light pb-2">
                            <span>Tasa de Comisión</span>
                            <span className="font-mono font-bold flex items-center gap-1">
                              {getCommissionRate() * 100}%
                              {simRating >= 4.8 ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[8px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                                  +10% Bono
                                </span>
                              ) : (
                                <span className="text-[8px] text-text-muted">(Base 70%)</span>
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between text-xs text-text-secondary border-b border-border-light pb-2">
                            <span>Deducción Plataforma (5%)</span>
                            <span className="font-mono text-red-600">-${getPlatformFee().toFixed(2)} USD</span>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-dashed border-border-light text-center">
                          <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Liquidación Neta Semanal (Estimado)</span>
                          <p className="text-3xl font-bold text-brand-primary font-mono mt-1">${getNetEarnings().toFixed(2)} USD</p>
                          <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
                            Aproximado Mensual: ${(getNetEarnings() * 4).toFixed(2)} USD
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Public Profile Card */}
                  <div className="bg-white border border-border-light rounded-sm p-6 sm:p-8">
                    <h3 className="text-md font-bold text-text-primary mb-5 pb-2 border-b border-border-light">Vista Previa de tu Perfil Público</h3>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                      <div className="w-16 h-16 rounded-full bg-brand-light text-brand-primary font-bold flex items-center justify-center text-xl flex-shrink-0 border border-brand-primary/20">
                        {agent.full_name.charAt(0)}
                      </div>
                      <div className="flex-grow text-center sm:text-left space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                          <h4 className="font-bold text-text-primary text-sm">{agent.full_name}</h4>
                          <span className="bg-emerald-50 text-emerald-700 text-[8px] font-bold px-2 py-0.5 rounded border border-emerald-100 self-center">
                            ASESOR CERTIFICADO
                          </span>
                        </div>
                        <p className="text-xs text-brand-primary font-semibold">Especialista en {agent.specialties.join(", ")}</p>
                        <p className="text-xs text-text-secondary italic">&quot;{agent.biography}&quot;</p>
                        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start pt-1">
                          {agent.languages.map((l) => (
                            <span key={l} className="bg-gray-100 text-text-secondary text-[9px] px-2 py-0.5 rounded">
                              🗣️ {l}
                            </span>
                          ))}
                          {agent.target_countries.map((c) => (
                            <span key={c} className="bg-brand-light text-brand-primary text-[9px] px-2 py-0.5 rounded">
                              📍 {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
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

              {/* ACTIVE STATE ONBOARDING STEPS */}
              {agent.status === "active" && (
                <div className="bg-white border border-border-light rounded-sm p-6 shadow-sm flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-light pb-2">
                    Pasos de Onboarding
                  </h4>
                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Completa las siguientes tareas iniciales para comenzar a recibir leads en tu chat:
                  </p>

                  <div className="space-y-3.5">
                    {/* Step 1 */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={onboardingSteps.training}
                        onChange={(e) => setOnboardingSteps(prev => ({ ...prev, training: e.target.checked }))}
                        className="mt-0.5 w-3.5 h-3.5 border-border-light text-brand-primary focus:ring-brand-primary"
                      />
                      <div>
                        <span className={`text-xs font-semibold block leading-tight ${onboardingSteps.training ? "line-through text-text-muted" : "text-text-primary"}`}>
                          Videos de Capacitación
                        </span>
                        <span className="text-[9px] text-text-muted">Aprende a usar el chat y armar formularios consulares.</span>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={onboardingSteps.payment}
                        onChange={(e) => setOnboardingSteps(prev => ({ ...prev, payment: e.target.checked }))}
                        className="mt-0.5 w-3.5 h-3.5 border-border-light text-brand-primary focus:ring-brand-primary"
                      />
                      <div>
                        <span className={`text-xs font-semibold block leading-tight ${onboardingSteps.payment ? "line-through text-text-muted" : "text-text-primary"}`}>
                          Configurar Cuenta de Pago
                        </span>
                        <span className="text-[9px] text-text-muted">Registra tu cuenta bancaria o Stripe para las transferencias de los viernes.</span>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={onboardingSteps.app}
                        onChange={(e) => setOnboardingSteps(prev => ({ ...prev, app: e.target.checked }))}
                        className="mt-0.5 w-3.5 h-3.5 border-border-light text-brand-primary focus:ring-brand-primary"
                      />
                      <div>
                        <span className={`text-xs font-semibold block leading-tight ${onboardingSteps.app ? "line-through text-text-muted" : "text-text-primary"}`}>
                          Descargar App de Agente
                        </span>
                        <span className="text-[9px] text-text-muted">Descarga la app en iOS o Android para notificaciones de chat.</span>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={onboardingSteps.mockRun}
                        onChange={(e) => setOnboardingSteps(prev => ({ ...prev, mockRun: e.target.checked }))}
                        className="mt-0.5 w-3.5 h-3.5 border-border-light text-brand-primary focus:ring-brand-primary"
                      />
                      <div>
                        <span className={`text-xs font-semibold block leading-tight ${onboardingSteps.mockRun ? "line-through text-text-muted" : "text-text-primary"}`}>
                          Simulación con Cliente Demo
                        </span>
                        <span className="text-[9px] text-text-muted">Realiza un trámite de simulación ficticio para validar tu aprendizaje.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DOCUMENTS CARD */}
              <div className="bg-white border border-border-light rounded-sm p-6 shadow-sm flex flex-col gap-4">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-light pb-2">
                  Documentación Adjunta
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Documento Identidad (DUI)</span>
                    <span className="text-emerald-600 font-bold">✓ Recibido</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Certificación Profesional</span>
                    <span className={agent.documents.certificacion ? "text-emerald-600 font-bold" : "text-text-muted font-medium"}>
                      {agent.documents.certificacion ? "✓ Recibido" : "No adjuntado"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Antecedentes Penales</span>
                    <span className={agent.documents.antecedentes ? "text-emerald-600 font-bold" : "text-text-muted font-medium"}>
                      {agent.documents.antecedentes ? "✓ Recibido" : "No adjuntado"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Currículum Vitae (CV)</span>
                    <span className={agent.documents.cv ? "text-emerald-600 font-bold" : "text-text-muted font-medium"}>
                      {agent.documents.cv ? "✓ Recibido" : "No adjuntado"}
                    </span>
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
      <div className="min-h-screen w-full flex items-center justify-center bg-background-main">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-text-secondary font-medium">Cargando portal de contratos...</span>
        </div>
      </div>
    }>
      <AgentPortalContent />
    </Suspense>
  );
}
