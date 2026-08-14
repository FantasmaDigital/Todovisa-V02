"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { AuthService } from "../../service/AuthService";
import { AgentClientService } from "@/services/client/AgentClientService";
import { AgencyClientService } from "@/services/client/AgencyClientService";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface Agent {
  id: string;
  name: string;
  title: string;
  photo: string;
  rating: number;
  reviewsCount: number;
  partnerType?: string;
  agencyName?: string;
  userId?: string;
}

interface CheckoutModalProps {
  agent?: Agent | null;
  product?: "vipro" | "advisor";
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutModal({ agent, product = "advisor", onClose, onSuccess }: CheckoutModalProps) {
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState<"billing" | "processing" | "success">("billing");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const agencyRef = localStorage.getItem("todovisa_agency_ref");
      if (agencyRef) {
        const url = new URL(window.location.href);
        if (url.searchParams.get("ref") !== agencyRef) {
          url.searchParams.set("ref", agencyRef);
          window.history.replaceState(null, "", url.toString());
        }
      }
    }
  }, []);

  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [agencyReferralInfo, setAgencyReferralInfo] = useState<{ agencyId: string; agencyName: string } | null>(null);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);

  // Auto-complete referral code from user metadata (Supabase) or localStorage
  useEffect(() => {
    const initReferral = async () => {
      let codeToUse = "";
      let infoObj: { agencyId: string; agencyName: string } | null = null;

      // 1. Check Supabase user metadata first
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metadata = (user as any).user_metadata || {};
        if (metadata.referred_by_agency_code) {
          codeToUse = metadata.referred_by_agency_code;
          if (metadata.referred_by_agency_id) {
            infoObj = {
              agencyId: metadata.referred_by_agency_id,
              agencyName: metadata.referred_by_agency_name || "Agencia Aliada"
            };
          }
        }
      }

      // 2. Fallback to localStorage if not found in user metadata
      if (!codeToUse && typeof window !== "undefined") {
        const localCode = localStorage.getItem("todovisa_agency_ref");
        if (localCode) {
          codeToUse = localCode;
          const infoStr = localStorage.getItem("todovisa_agency_info");
          if (infoStr) {
            try {
              const parsed = JSON.parse(infoStr);
              infoObj = { agencyId: parsed.agencyId, agencyName: parsed.agencyName };
            } catch (e) {}
          }
        }
      }

      if (codeToUse) {
        setReferralCodeInput(codeToUse);
        if (infoObj) {
          setAgencyReferralInfo(infoObj);
        } else {
          // Validate code with API if info object wasn't stored yet
          setIsValidatingCode(true);
          const validation = await AgencyClientService.validateAgencyCode(codeToUse);
          setIsValidatingCode(false);
          if (validation.valid && validation.agencyId) {
            setAgencyReferralInfo({
              agencyId: validation.agencyId,
              agencyName: validation.agencyName || "Agencia Aliada"
            });
          } else {
            setReferralError(validation.error || "Código de referido inválido");
          }
        }
      }
    };

    initReferral();
  }, [user]);

  const handleApplyReferralCode = async (codeToValidate: string) => {
    if (!codeToValidate.trim()) {
      setAgencyReferralInfo(null);
      setReferralError(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("todovisa_agency_ref");
        localStorage.removeItem("todovisa_agency_info");
      }
      return;
    }

    setIsValidatingCode(true);
    setReferralError(null);

    const validation = await AgencyClientService.processAndStoreAgencyCode(codeToValidate, user?.id);
    setIsValidatingCode(false);

    if (validation && validation.valid && validation.agencyId) {
      setAgencyReferralInfo({
        agencyId: validation.agencyId,
        agencyName: validation.agencyName || "Agencia Aliada"
      });
      setReferralError(null);
    } else {
      setAgencyReferralInfo(null);
      setReferralError(validation?.error || "Código inválido o no corresponde a una Agencia");
    }
  };

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test";
  const paypalMode = process.env.NEXT_PUBLIC_PAYPAL_MODE || (process.env.NODE_ENV === "production" ? "live" : "sandbox");
  const isSandbox = paypalMode === "sandbox" || paypalClientId === "test";

  const [basePrice, setBasePrice] = useState(Number(process.env.NEXT_PUBLIC_FULL_SERVICE_PRICE) || 150);
  const [viproPrice, setViproPrice] = useState(Number(process.env.NEXT_PUBLIC_VIPRO_PRICE) || 19.99);

  useEffect(() => {
    const savedPrice = localStorage.getItem("fullServicePrice");
    if (savedPrice) {
      setBasePrice(Number(savedPrice));
    }
    const savedViproPrice = localStorage.getItem("viproPrice");
    if (savedViproPrice) {
      setViproPrice(Number(savedViproPrice));
    }
  }, []);

  const amountToPay = product === "vipro" ? viproPrice : basePrice;

  const processSuccessfulPayment = async (paypalTransactionId?: string) => {
    setStep("processing");
    try {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {
          last_paypal_tx: paypalTransactionId || `PAYPAL_SIM_${Date.now()}`
        };
        if (product === "vipro") {
          updateData.has_paid_vipro = true;
        } else {
          updateData.has_paid_advisor = true;
          if (agent) {
            // Store the real Supabase user UUID (agent.userId), NOT the computed "agent-{id}" string
            updateData.assigned_agent_id = agent.userId || agent.id;
            updateData.assigned_agency_name = agent.agencyName || null;
          }
        }

        // Persist to Supabase Auth metadata via API
        try {
          await AuthService.updateUser(updateData);
          console.log("Status successfully saved to Supabase user metadata.");
        } catch (err) {
          console.error("Failed to save status to Supabase:", err);
        }

        // ── ALWAYS LINK CLIENT TO AGENT/AGENCY UPON ADVISOR HIRE ──────────────────
        if (product === "advisor" && agent) {
          try {
            await AgentClientService.createClientRequest({
              agency_id: agent.userId || agent.id,
              agencyName: agent.agencyName || null,
              client_id: user.id,
              client_name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
              client_email: user.email,
              service_type: "Full Advisor Concierge",
            });
          } catch (agencyErr) {
            console.warn("Notice: agency_client_requests API error:", agencyErr);
          }
        }

        // ── COMMISSION LOGGING ───────────────────────────────────────
        if (product === "advisor" && agent?.id) {
          try {
            const agencyRef = typeof window !== "undefined" ? localStorage.getItem("todovisa_agency_ref") : null;
            let commissionRate = 0.40;
            let commissionType = "standard_advisor";

            if (agencyRef) {
              commissionRate = 0.30;
              commissionType = "agency_referral";
            } else if (agent.title?.toLowerCase().includes("experto") || agent.title?.toLowerCase().includes("master")) {
              commissionRate = 0.60;
              commissionType = "expert_advisor";
            }

            const agentCommissionAmount = amountToPay * commissionRate;
            const todovisaShareAmount = amountToPay - agentCommissionAmount;

            await AgentClientService.createCommission({
              // Use real Supabase UUID for agent commission tracking
              agent_id: agencyRef || agent.userId || agent.id,
              client_id: user.id,
              client_name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
              service_type: commissionType,
              sale_amount: amountToPay,
              commission_rate: commissionRate,
              commission_amount: agentCommissionAmount,
              todovisa_share: todovisaShareAmount,
              status: "pending",
              created_at: new Date().toISOString()
            });
          } catch (commErr) {
            console.warn("Notice: agent_commissions API error:", commErr);
          }
        }

        // Update local React Auth Store
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatedStoreUser: any = { ...user };
        if (product === "vipro") {
          updatedStoreUser.hasPaidVipro = true;
        } else {
          updatedStoreUser.hasPaidAdvisor = true;
          if (agent) {
            // Store the real UUID so messages and agent portal can find the client
            updatedStoreUser.assignedAgentId = agent.userId || agent.id;
            updatedStoreUser.assignedAgencyName = agent.agencyName || null;
          }
        }
        setUser(updatedStoreUser);
      }

      setTimeout(() => {
        setStep("success");
      }, 1500);
    } catch (e) {
      console.error("Error finalizing payment:", e);
      setStep("success");
    }
  };

  const handleSandboxPayment = () => {
    processSuccessfulPayment(`PAYPAL_SANDBOX_TX_${Date.now()}`);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-lg max-w-xl w-full overflow-hidden shadow-2xl relative border border-border-light flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        {step !== "processing" && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-text-secondary hover:text-text-primary bg-background-main hover:bg-background-hover p-1.5 rounded-full transition-colors z-20 focus:outline-none cursor-pointer"
            title="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* STEP 1: PAYPAL CHECKOUT */}
        {step === "billing" && (
          <div className="flex flex-col text-left">
            {/* Header */}
            <div className="p-6 bg-[#003087] text-white border-b border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"></div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-200 mb-1">Pasarela Oficial PayPal</p>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>💳 Pago Seguro con PayPal</span>
                  </h3>
                </div>
                <div className="bg-white/10 px-3 py-1 rounded text-[11px] font-bold text-white border border-white/20">
                  {isSandbox ? "🟡 Sandbox Test Env" : "🟢 Live PayPal"}
                </div>
              </div>
            </div>

            {/* Agent Summary */}
            {product !== "vipro" && agent && (
              <div className="p-5 bg-blue-50/50 border-b border-border-light flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  <img
                    src={agent.photo}
                    alt={agent.name}
                    className="w-12 h-12 rounded-full object-cover border border-border-light flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs text-text-muted uppercase tracking-wider font-bold">Asesor Asignado</p>
                    <h4 className="font-bold text-text-primary text-sm truncate">{agent.name}</h4>
                    <p className="text-xs text-text-secondary truncate">{agent.title}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Agency Referral Code Section */}
            <div className="px-6 py-4 bg-slate-50 border-b border-border-light space-y-2">
              <label className="block text-xs font-bold text-text-primary uppercase tracking-wide">
                🏢 Código de Referido de Agencia (Opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                  placeholder="Ej. AGENCIA-SAN-SALVADOR"
                  className="flex-1 px-3 py-2 text-xs border border-border-light rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleApplyReferralCode(referralCodeInput)}
                  disabled={isValidatingCode}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {isValidatingCode ? "Validando..." : "Aplicar"}
                </button>
              </div>

              {agencyReferralInfo && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium">
                  <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Agencia Vinculada: <strong>{agencyReferralInfo.agencyName}</strong></span>
                </div>
              )}

              {referralError && (
                <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                  <span>⚠️ {referralError}</span>
                </p>
              )}
            </div>

            {/* Price Details */}
            <div className="px-6 py-4 border-b border-border-light space-y-2">
              {product === "vipro" ? (
                <>
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Evaluación Diagnóstica VIPRO</span>
                    <span>${viproPrice.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-text-primary pt-2 border-t border-dashed border-border-light">
                    <span>Total a pagar vía PayPal</span>
                    <span className="text-[#003087] text-lg font-mono font-extrabold">${viproPrice.toFixed(2)} USD</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Asesoría Consular Completa</span>
                    <span>${basePrice.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-text-primary pt-2 border-t border-dashed border-border-light">
                    <span>Total a pagar vía PayPal</span>
                    <span className="text-[#003087] text-lg font-mono font-extrabold">${basePrice.toFixed(2)} USD</span>
                  </div>
                </>
              )}
            </div>

            {/* PayPal Action Box */}
            <div className="p-6 space-y-4 text-center">
              {paypalClientId === "test" ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wide">
                    <span>🧪 Entorno de Pruebas Activo (PayPal Sandbox)</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    El sistema está configurado en modo prueba Sandbox. Puedes completar la simulación del pago instantáneamente para validar el flujo completo sin realizar cobros reales.
                  </p>
                  <button
                    type="button"
                    onClick={handleSandboxPayment}
                    className="w-full py-3.5 bg-[#FFC439] hover:bg-[#F2BA31] text-[#003087] font-extrabold text-sm rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Pagar ${amountToPay.toFixed(2)} USD con PayPal (Sandbox) &rarr;</span>
                  </button>
                </div>
              ) : (
                <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD" }}>
                  <div className="space-y-3 text-left">
                    <p className="text-xs text-text-secondary text-center mb-4">
                      Completa tu transacción de manera 100% segura usando tu saldo PayPal o tu tarjeta de débito/crédito:
                    </p>
                    <div className="relative z-10">
                      <PayPalButtons
                        style={{ layout: "vertical", label: "pay" }}
                        createOrder={(data, actions) => {
                          return actions.order.create({
                            intent: "CAPTURE",
                            purchase_units: [
                              {
                                description: product === "vipro" ? "Evaluación Diagnóstica VIPRO" : "Asesoría Consular Completa",
                                amount: {
                                  currency_code: "USD",
                                  value: amountToPay.toFixed(2),
                                },
                              },
                            ],
                          });
                        }}
                        onApprove={async (data, actions) => {
                          if (actions.order) {
                            const details = await actions.order.capture();
                            const txId = details.id || `PAYPAL_${Date.now()}`;
                            await processSuccessfulPayment(txId);
                          }
                        }}
                        onError={(err) => {
                          console.error("PayPal checkout error:", err);
                          alert("Ocurrió un error con el pago de PayPal. Por favor, intenta de nuevo.");
                        }}
                      />
                    </div>
                  </div>
                </PayPalScriptProvider>
              )}

              <div className="flex items-center justify-center gap-4 text-[10px] text-text-muted pt-2 border-t border-border-light">
                <span>🔒 Cifrado SSL 256-bit</span>
                <span>•</span>
                <span>Protección al Comprador PayPal</span>
                <span>•</span>
                <span>Sin cargos ocultos</span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-background-main/50 border-t border-border-light flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-white border border-border-light text-text-secondary hover:text-text-primary text-xs font-semibold rounded-sm transition-all focus:outline-none cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PROCESSING TRANSACTION */}
        {step === "processing" && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-[#003087] rounded-full animate-spin"></div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-text-primary">Validando pago en PayPal...</h4>
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                Por favor, no recargues ni cierres la pantalla. Estamos registrando tu transacción en la pasarela.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: TRANSACTION SUCCESS */}
        {step === "success" && (
          <div className="p-8 flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-text-primary">
                {product === "vipro" ? "¡Pago VIPRO Confirmado!" : "¡Pago de Asesoría Confirmado!"}
              </h4>
              {product === "vipro" ? (
                <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
                  Tu pago de <span className="font-bold text-text-primary">${viproPrice.toFixed(2)} USD</span> vía PayPal se ha registrado exitosamente.
                </p>
              ) : (
                <>
                <h3 className="text-sm font-bold text-text-primary">Pago Exitoso</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Tu pago de <span className="font-bold text-text-primary">${amountToPay.toFixed(2)} USD</span> vía PayPal ha sido recibido. Se ha habilitado la asesoría con <span className="font-semibold text-text-primary">{agent?.name}</span>.
                </p>
                </>
              )}
            </div>

            <button
              onClick={() => {
                onSuccess();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-sm shadow-sm transition-colors focus:outline-none cursor-pointer"
            >
              {product === "vipro"
                ? "Ir a mi Formulario VIPRO"
                : `Comenzar Chat con ${(agent?.name || "").split(" ")[1] || agent?.name || "Asesor"}`}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
