"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "../../components/shared/Header";
import { Footer } from "../../components/shared/Footer";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "next/navigation";
import { ROLES } from "../../constants/roles";
import { AgentClientService } from "@/services/client/AgentClientService";

export default function MetodosCobroPage() {
  const headerRef = useRef(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  // States
  const [payoutMethod, setPayoutMethod] = useState<'paypal' | 'ach'>('paypal');
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState("Ahorros");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingCode, setRoutingCode] = useState("");
  const [taxId, setTaxId] = useState("");
  const [savingPayout, setSavingPayout] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Fetch agent application payout settings from API
  const loadPayoutSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const portalRes = await AgentClientService.getPortalData(user.id);
      const app = portalRes.application;
      if (app?.payout_settings) {
        const settings = app.payout_settings as any;
        if (settings.method) setPayoutMethod(settings.method);
        if (settings.paypal_email) setPaypalEmail(settings.paypal_email);
        if (settings.bank_name) setBankName(settings.bank_name);
        if (settings.account_type) setAccountType(settings.account_type);
        if (settings.account_number) setAccountNumber(settings.account_number);
        if (settings.routing_code) setRoutingCode(settings.routing_code);
        if (settings.tax_id) setTaxId(settings.tax_id);
      }
    } catch (err) {
      console.error("Error loading payout settings:", err);
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
      loadPayoutSettings();
    }
  }, [isMounted, user?.id]);

  // Save payout settings
  const handleSavePayoutSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

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
      await AgentClientService.updateApplication({
        userId: user.id,
        updates: { payout_settings: updatedSettings }
      });
      showToast("Configuración de pago guardada exitosamente.", "success");
    } catch (err: unknown) {
      console.error("Error saving payout settings:", err);
      const msg = err instanceof Error ? err.message : String(err);
      showToast(msg || "Error al guardar configuración.", "error");
    } finally {
      setSavingPayout(false);
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
          <h1 className="text-2xl font-bold text-text-primary">Métodos de Cobro</h1>
          <p className="text-xs text-text-secondary mt-1">Registra y edita el procesador donde deseas transferir tus comisiones todos los viernes.</p>
        </div>

        {/* Configuration Form */}
        <div className="max-w-2xl border border-border-light rounded-sm p-6 bg-white space-y-6 text-left mx-auto">
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-1">Configuración Financiera</h3>
            <p className="text-xs text-text-secondary">Elige el método e introduce los detalles del titular.</p>
          </div>

          {loading ? (
            <div className="space-y-4 py-4 animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-3/4"></div>
            </div>
          ) : (
            <form onSubmit={handleSavePayoutSettings} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Método de Cobro
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('paypal')}
                    className={`py-3 px-4 rounded border text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                      payoutMethod === 'paypal'
                        ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                        : 'bg-background-main text-text-secondary border-border-light hover:border-brand-primary/30'
                    }`}
                  >
                    <span>💙</span>
                    <span>PayPal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('ach')}
                    className={`py-3 px-4 rounded border text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                      payoutMethod === 'ach'
                        ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                        : 'bg-background-main text-text-secondary border-border-light hover:border-brand-primary/30'
                    }`}
                  >
                    <span>🏦</span>
                    <span>Transferencia ACH</span>
                  </button>
                </div>
              </div>

              {payoutMethod === 'paypal' ? (
                <div className="p-4 bg-background-main rounded border border-border-light space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                      Correo Electrónico de PayPal
                    </label>
                    <input
                      type="email"
                      required
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      placeholder="correo@paypal.com"
                      className="w-full px-3 py-2 bg-white border border-border-light rounded-sm text-sm focus:border-brand-primary focus:outline-none transition-all text-text-primary"
                    />
                    <span className="text-[9px] text-text-muted mt-1 block">Tus fondos se transferirán de inmediato a esta cuenta.</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-background-main rounded border border-border-light space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                        Nombre del Banco
                      </label>
                      <input
                        type="text"
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Banco Agrícola, BAC, etc."
                        className="w-full px-3 py-2 bg-white border border-border-light rounded-sm text-sm focus:border-brand-primary focus:outline-none transition-all text-text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                        Tipo de Cuenta
                      </label>
                      <select
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-border-light rounded-sm text-sm focus:border-brand-primary focus:outline-none transition-all text-text-primary cursor-pointer h-[38px]"
                      >
                        <option value="Ahorros">Ahorros</option>
                        <option value="Corriente">Corriente</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                        Número de Cuenta
                      </label>
                      <input
                        type="text"
                        required
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Nº de cuenta bancaria"
                        className="w-full px-3 py-2 bg-white border border-border-light rounded-sm text-sm focus:border-brand-primary focus:outline-none transition-all text-text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                        Código de Ruta / IBAN / UNI
                      </label>
                      <input
                        type="text"
                        required
                        value={routingCode}
                        onChange={(e) => setRoutingCode(e.target.value)}
                        placeholder="Código bancario"
                        className="w-full px-3 py-2 bg-white border border-border-light rounded-sm text-sm focus:border-brand-primary focus:outline-none transition-all text-text-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1">
                      Identificación Tributaria / NIT / DUI
                    </label>
                    <input
                      type="text"
                      required
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="Identificación del titular de la cuenta"
                      className="w-full px-3 py-2 bg-white border border-border-light rounded-sm text-sm focus:border-brand-primary focus:outline-none transition-all text-text-primary"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPayout}
                  className="px-6 py-2.5 bg-brand-primary hover:bg-brand-hover disabled:opacity-50 text-white text-xs font-bold rounded-sm transition-all focus:outline-none cursor-pointer flex items-center justify-center gap-2 shadow-sm border-none"
                >
                  {savingPayout ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Guardando configuración...
                    </>
                  ) : (
                    "💾 Guardar Configuración de Pago"
                  )}
                </button>
              </div>
            </form>
          )}
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
