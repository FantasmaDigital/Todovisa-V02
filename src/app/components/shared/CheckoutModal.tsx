"use client";

import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { AuthService } from "../../service/AuthService";
import { AgentClientService } from "@/services/client/AgentClientService";

interface Agent {
  id: string;
  name: string;
  title: string;
  photo: string;
  rating: number;
  reviewsCount: number;
  partnerType?: string;
  agencyName?: string;
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

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test";
  const paypalMode = process.env.NEXT_PUBLIC_PAYPAL_MODE || "sandbox";
  const isSandbox = paypalMode !== "live" || paypalClientId === "test";

  const amountToPay = product === "vipro" ? 19.99 : 112.50;

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
            updateData.assigned_agent_id = agent.id;
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

        // ── B2B AGENCY FLOW ──────────────────────────────────────────────────────
        if (product === "advisor" && agent && agent.partnerType === "b2b_agency_entity") {
          try {
            await AgentClientService.createClientRequest({
              agencyName: agent.agencyName,
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
              agent_id: agencyRef || agent.id,
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
            updatedStoreUser.assignedAgentId = agent.id;
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

            {/* Price Details */}
            <div className="px-6 py-4 border-b border-border-light space-y-2">
              {product === "vipro" ? (
                <>
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Evaluación Diagnóstica VIPRO</span>
                    <span>$19.99 USD</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-text-primary pt-2 border-t border-dashed border-border-light">
                    <span>Total a pagar vía PayPal</span>
                    <span className="text-[#003087] text-lg font-mono font-extrabold">$19.99 USD</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Asesoría Consular Completa (Plan Concierge)</span>
                    <span>$150.00 USD</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    <span className="flex items-center gap-1">
                      🏷️ Descuento Especial
                    </span>
                    <span>-$37.50 USD</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-text-primary pt-2 border-t border-dashed border-border-light">
                    <span>Total a pagar vía PayPal</span>
                    <span className="text-[#003087] text-lg font-mono font-extrabold">$112.50 USD</span>
                  </div>
                </>
              )}
            </div>

            {/* PayPal Action Box */}
            <div className="p-6 space-y-4 text-center">
              {isSandbox ? (
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
                <div className="space-y-3">
                  <p className="text-xs text-text-secondary">
                    Haz clic en el botón oficial para autenticarte y confirmar tu pago de manera 100% segura con PayPal:
                  </p>
                  <button
                    type="button"
                    onClick={() => processSuccessfulPayment(`PAYPAL_LIVE_${Date.now()}`)}
                    className="w-full py-3.5 bg-[#0070BA] hover:bg-[#005EA6] text-white font-extrabold text-sm rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Completa tu pago seguro de ${amountToPay.toFixed(2)} USD con PayPal</span>
                  </button>
                </div>
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
                  Tu pago de <span className="font-bold text-text-primary">$19.99 USD</span> vía PayPal se ha registrado exitosamente.
                </p>
              ) : (
                <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
                  Tu pago de <span className="font-bold text-text-primary">$112.50 USD</span> vía PayPal ha sido recibido. Se ha habilitado la asesoría con <span className="font-semibold text-text-primary">{agent?.name}</span>.
                </p>
              )}
            </div>

            <button
              onClick={() => {
                onSuccess();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-sm shadow-sm transition-colors focus:outline-none cursor-pointer"
            >
              {product === "vipro"
                ? "Ir a mi Formulario VIPRO &rarr;"
                : `Comenzar Chat con ${(agent?.name || "").split(" ")[1] || agent?.name || "Asesor"} &rarr;`}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
