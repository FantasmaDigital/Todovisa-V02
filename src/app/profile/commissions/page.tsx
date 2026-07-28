"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "../../components/shared/Header";
import { Footer } from "../../components/shared/Footer";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "next/navigation";
import { ROLES } from "../../constants/roles";
import { ProfileClientService } from "@/services/client/ProfileClientService";

interface AgentCommission {
  id: string;
  agent_id: string;
  client_name: string;
  visa_type?: string;
  service_type?: string;
  gross_amount?: number;
  commission_rate?: number;
  commission_amount: number;
  status: string;
  created_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}


export default function ComisionesPage() {
  const headerRef = useRef(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  // States
  const [agentCommissions, setAgentCommissions] = useState<AgentCommission[]>([]);
  const [isLoadingCommissions, setIsLoadingCommissions] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch agent commissions from API
  const loadCommissions = async () => {
    if (!user) return;
    setIsLoadingCommissions(true);
    try {
      // Validate role with the API
      const profileRes = await ProfileClientService.getProfile(user.id);
      const apiRole = profileRes?.profile?.role;
      if (apiRole !== ROLES.AGENT && apiRole !== ROLES.AGENCY) {
        router.push("/profile");
        return;
      }

      const data = await ProfileClientService.getCommissions(user.id);
      setAgentCommissions(data || []);
    } catch (err) {
      console.error("Error fetching commissions:", err);
      router.push("/profile");
    } finally {
      setIsLoadingCommissions(false);
    }
  };

  useEffect(() => {
    if (isMounted && user) {
      loadCommissions();
    }
  }, [isMounted, user?.id]);

  // Statistics calculation helper
  const getCommissionRateLabel = () => {
    if (user?.role === ROLES.AGENCY) {
      return "30% (Referido)";
    }
    return "60% / 40%";
  };

  const getGrossEarnings = () => {
    return agentCommissions
      .filter((c) => c.status === "completed" || c.status === "pending")
      .reduce((sum, c) => sum + (c.gross_amount || c.commission_amount || 0), 0);
  };

  const getNetEarnings = () => {
    return agentCommissions
      .filter((c) => c.status === "completed" || c.status === "pending")
      .reduce((sum, c) => sum + (c.commission_amount || 0), 0);
  };

  const getPlatformShare = () => {
    return getGrossEarnings() - getNetEarnings();
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
            onClick={() => router.push("/agents/portal")}
            className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer border-none bg-transparent"
          >
            &larr; Volver al Panel
          </button>
        </div>

        <div className="mb-8 pb-4 border-b border-border-light text-left">
          <h1 className="text-2xl font-bold text-text-primary">Historial y Control de Comisiones</h1>
          <p className="text-xs text-text-secondary mt-1">Revisa el detalle, tasa de comisiones y balances netos acumulados de tus expedientes cerrados.</p>
        </div>

        {/* Info Card explaining how commissions work */}
        <div className="bg-brand-light/30 border border-brand-primary/10 rounded-sm p-5 mb-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-brand-primary font-bold text-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.085 1.085l-.04.02-.086.041a.25.25 0 00-.115.1l-.014.032m-3.56 3.85a9 9 0 1112.728 0M12 20.25a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5z" />
            </svg>
            <span>¿Cómo funciona el esquema de comisiones?</span>
          </div>
          {user.role === ROLES.AGENCY ? (
            <p className="text-xs text-text-secondary leading-relaxed">
              Como Agencia/Socio Comercial, recibes el <strong>30% del importe bruto</strong> de cada trámite consular realizado por los clientes que ingresen a la plataforma mediante tu <strong>Link de Referido Exclusivo</strong>. TodoVisa administra la plataforma y el soporte operativo. Los cortes se realizan de forma semanal y las liquidaciones se transfieren a tu cuenta bancaria o PayPal registrada todos los viernes.
            </p>
          ) : (
            <p className="text-xs text-text-secondary leading-relaxed">
              Como Asesor Certificado de la red TodoVisa, comisionas un porcentaje directo de <strong>40% (tarifa estándar) o 60% (tarifa experto)</strong> por cada trámite/expediente asignado y auditado con éxito. El procesamiento de liquidaciones se realiza semanalmente y los pagos netos acumulados se depositan en tu método de cobro configurado cada viernes.
            </p>
          )}
        </div>

        {/* Financial metrics block */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 text-left">
          <div className="p-4 bg-white border border-border-light rounded-sm shadow-xs">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Facturación Bruta Total</span>
            <p className="text-xl font-bold text-text-primary font-mono mt-1">${getGrossEarnings().toFixed(2)} USD</p>
          </div>

          <div className="p-4 bg-white border border-border-light rounded-sm shadow-xs">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Esquema de Comisión</span>
            <p className="text-xl font-bold text-emerald-600 font-mono mt-1">{getCommissionRateLabel()}</p>
          </div>

          <div className="p-4 bg-white border border-border-light rounded-sm shadow-xs">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Parte TodoVisa</span>
            <p className="text-xl font-bold text-text-secondary font-mono mt-1">${getPlatformShare().toFixed(2)} USD</p>
          </div>


          <div className="p-4 bg-brand-light border border-brand-primary/20 rounded-sm shadow-xs">
            <span className="text-[10px] text-brand-primary uppercase tracking-wider font-bold">Liquidación Neta Acumulada</span>
            <p className="text-xl font-bold text-brand-primary font-mono mt-1">${getNetEarnings().toFixed(2)} USD</p>
          </div>
        </div>

        {/* Commissions Table */}
        <div className="border border-border-light rounded-sm p-6 bg-white space-y-4 text-left">
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-1">Listado de Expedientes</h3>
            <p className="text-xs text-text-secondary">Registro histórico de asesorías de visas completadas y comisionadas.</p>
          </div>

          {isLoadingCommissions ? (
            <div className="space-y-3 py-4">
              <div className="h-6 bg-gray-100 rounded animate-pulse w-full"></div>
              <div className="h-6 bg-gray-100 rounded animate-pulse w-full"></div>
              <div className="h-6 bg-gray-100 rounded animate-pulse w-full"></div>
            </div>
          ) : agentCommissions.length === 0 ? (
            <div className="py-8 text-center text-text-muted italic border-t border-border-light text-xs">
              No se han encontrado registros de comisiones aprobadas para tu cuenta.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-light text-text-secondary uppercase tracking-wider text-[9px] font-bold">
                    <th className="py-2.5">Fecha</th>
                    <th className="py-2.5">Cliente</th>
                    {user.role === ROLES.AGENCY && <th className="py-2.5">Asesor</th>}
                    <th className="py-2.5">Trámite</th>
                    <th className="py-2.5">Importe</th>
                    <th className="py-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light text-text-primary">
                  {agentCommissions.map((c) => (
                    <tr key={c.id} className="hover:bg-background-main/50 transition-colors">
                      <td className="py-3 font-mono">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="py-3 font-semibold">{c.client_name}</td>
                      {user.role === ROLES.AGENCY && (
                        <td className="py-3 text-text-secondary">
                          {c.profile ? `${c.profile.first_name} ${c.profile.last_name}` : "N/A"}
                        </td>
                      )}
                      <td className="py-3 text-text-secondary">{c.service_type || c.visa_type || "Visa"}</td>

                      <td className="py-3 font-bold font-mono">${c.commission_amount.toFixed(2)} USD</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          c.status === "completed" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {c.status === "completed" ? "Completado" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
