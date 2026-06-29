"use client";

import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import supabase from "../../lib/supabase";

interface Agent {
  id: string;
  name: string;
  title: string;
  photo: string;
  rating: number;
  reviewsCount: number;
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
  
  // Card Form fields
  const [cardName, setCardName] = useState(`${user?.firstName || ""} ${user?.lastName || ""}`.trim());
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isVipro = product === "vipro";
  const hasViproDiscount = !isVipro && !!user?.hasPaidVipro;
  const originalPrice = isVipro ? 19.99 : 150.00;
  const discountAmount = hasViproDiscount ? 37.50 : 0.00;
  const finalPrice = originalPrice - discountAmount;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    
    // Group by 4s
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(" "));
    } else {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    
    if (value.length > 2) {
      setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setCardExpiry(value);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      setCardCvv(value);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!cardName.trim()) newErrors.cardName = "Requerido";
    if (cardNumber.replace(/\s/g, "").length !== 16) newErrors.cardNumber = "Número de tarjeta inválido";
    if (cardExpiry.length !== 5) newErrors.cardExpiry = "Formato MM/YY";
    if (cardCvv.length < 3) newErrors.cardCvv = "CVV inválido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStep("processing");
    
    // Simulate API call to bank/stripe
    setTimeout(async () => {
      if (user) {
        const assignedAgentId = agent ? agent.id : user.assignedAgentId || "agent-1";
        
        try {
          await supabase.auth.updateUser({
            data: isVipro 
              ? { has_paid_vipro: true }
              : {
                  has_paid_advisor: true,
                  has_paid_vipro: true,
                  assigned_agent_id: assignedAgentId
                }
          });
          console.log("Payment status successfully saved to Supabase user metadata.");
        } catch (err) {
          console.error("Failed to save payment status to Supabase:", err);
        }

        if (isVipro) {
          setUser({
            ...user,
            hasPaidVipro: true,
          });
        } else {
          setUser({
            ...user,
            hasPaidAdvisor: true,
            hasPaidVipro: true,
            assignedAgentId: assignedAgentId,
          });
        }
      }
      setStep("success");
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-lg max-w-xl w-full overflow-hidden shadow-2xl relative border border-border-light flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Close Button (only allowed in billing / success) */}
        {step !== "processing" && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-text-secondary hover:text-text-primary bg-background-main hover:bg-background-hover p-1.5 rounded-full transition-colors z-20 focus:outline-none"
            title="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* STEP 1: BILLING & PAYMENT DETAILS */}
        {step === "billing" && (
          <form onSubmit={handleSubmit} className="flex flex-col">
            {/* Header */}
            <div className="p-6 bg-brand-primary text-white border-b border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"></div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/75 mb-1">Pasarela de Pago Segura</p>
              <h3 className="text-xl font-bold font-serif italic text-white">
                {isVipro ? "Adquirir Evaluación VIPRO" : "Contratar Asesoría VIP"}
              </h3>
            </div>

            {/* Product Summary */}
            {isVipro ? (
              <div className="p-5 bg-brand-light/35 border-b border-border-light flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-light border border-border-light flex items-center justify-center flex-shrink-0 text-2xl">
                  📋
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-bold">Servicio Seleccionado</p>
                  <h4 className="font-bold text-text-primary text-sm truncate">Evaluación VIPRO Diagnóstica</h4>
                  <p className="text-xs text-text-secondary truncate">Análisis automático y perfilamiento consular completo</p>
                </div>
              </div>
            ) : agent ? (
              <div className="p-5 bg-brand-light/35 border-b border-border-light flex items-center gap-4">
                <img
                  src={agent.photo}
                  alt={agent.name}
                  className="w-12 h-12 rounded-full object-cover border border-border-light flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-bold">Asesor Asignado</p>
                  <h4 className="font-bold text-text-primary text-sm truncate">{agent.name}</h4>
                  <p className="text-xs text-text-secondary truncate">{agent.title}</p>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-brand-light/35 border-b border-border-light flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-light border border-border-light flex items-center justify-center flex-shrink-0 text-2xl">
                  🤝
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-muted uppercase tracking-wider font-bold">Servicio Seleccionado</p>
                  <h4 className="font-bold text-text-primary text-sm truncate">Servicio Completo (Asesor Consular)</h4>
                  <p className="text-xs text-text-secondary truncate">Evaluación VIPRO + Asesor Certificado de la red</p>
                </div>
              </div>
            )}

            {/* Price Details */}
            <div className="px-6 py-4 border-b border-border-light space-y-2">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>
                  {isVipro ? "Evaluación Diagnóstica VIPRO (Express)" : "Asesoría Consular Completa (Plan Premium)"}
                </span>
                <span>${originalPrice.toFixed(2)} USD</span>
              </div>
              {hasViproDiscount && (
                <div className="flex justify-between text-xs text-emerald-600 font-medium">
                  <span className="flex items-center gap-1">
                    🏷️ Cupón: VIPRO-EVAL-25%
                  </span>
                  <span>-${discountAmount.toFixed(2)} USD</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-text-primary pt-2 border-t border-dashed border-border-light">
                <span>Total a pagar</span>
                <span className="text-brand-primary text-base">${finalPrice.toFixed(2)} USD</span>
              </div>
            </div>

            {/* Payment Fields */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Nombre del Titular
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className={`w-full px-3 py-2 bg-background-main border ${
                    errors.cardName ? "border-red-400 focus:ring-red-300" : "border-border-light focus:border-border-focus"
                  } rounded-sm text-sm focus:outline-none transition-all text-text-primary`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                  Número de Tarjeta
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="0000 0000 0000 0000"
                    className={`w-full pl-3 pr-10 py-2 bg-background-main border ${
                      errors.cardNumber ? "border-red-400" : "border-border-light focus:border-border-focus"
                    } rounded-sm text-sm focus:outline-none transition-all text-text-primary font-mono`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 select-none pointer-events-none">
                    <span className="text-lg">💳</span>
                  </div>
                </div>
                {errors.cardNumber && <p className="text-[10px] text-red-500 mt-1">{errors.cardNumber}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                    Vencimiento
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    placeholder="MM/YY"
                    maxLength={5}
                    className={`w-full px-3 py-2 bg-background-main border ${
                      errors.cardExpiry ? "border-red-400" : "border-border-light focus:border-border-focus"
                    } rounded-sm text-sm focus:outline-none transition-all text-text-primary text-center font-mono`}
                  />
                  {errors.cardExpiry && <p className="text-[10px] text-red-500 mt-1">{errors.cardExpiry}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                    CVV / CVC
                  </label>
                  <input
                    type="password"
                    value={cardCvv}
                    onChange={handleCvvChange}
                    placeholder="***"
                    maxLength={4}
                    className={`w-full px-3 py-2 bg-background-main border ${
                      errors.cardCvv ? "border-red-400" : "border-border-light focus:border-border-focus"
                    } rounded-sm text-sm focus:outline-none transition-all text-text-primary text-center font-mono`}
                  />
                  {errors.cardCvv && <p className="text-[10px] text-red-500 mt-1">{errors.cardCvv}</p>}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-6 bg-background-main/50 border-t border-border-light flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-white border border-border-light text-text-secondary hover:text-text-primary text-xs font-semibold rounded-sm transition-all focus:outline-none"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand-primary text-white hover:bg-brand-hover text-xs font-semibold rounded-sm transition-all focus:outline-none shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>🔒 Pagar ${finalPrice.toFixed(2)} USD</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: PROCESSING TRANSACTION */}
        {step === "processing" && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin"></div>
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-text-primary">Procesando pago seguro...</h4>
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                Por favor, no recargues ni cierres la página. Estamos validando la transacción con tu entidad bancaria.
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
            
            {isVipro ? (
              <>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-text-primary">¡Pago Realizado con Éxito!</h4>
                  <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
                    Has adquirido la <span className="font-semibold text-text-primary">Evaluación VIPRO</span>. Hemos habilitado el acceso para que completes tu formulario digital de inmediato.
                  </p>
                </div>
                <div className="w-full bg-brand-light/35 border border-brand-primary/10 rounded p-4 text-left flex items-center gap-3">
                  <span className="text-xl">📋</span>
                  <div>
                    <p className="text-xs font-bold text-brand-primary">Evaluación Habilitada</p>
                    <p className="text-[10px] text-text-secondary leading-normal">
                      Puedes acceder a completar tu evaluación desde la sección de VIPRO o tu panel de control.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-text-primary">¡Pago Realizado con Éxito!</h4>
                  {user?.viproCompleted ? (
                    <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
                      Has contratado la asesoría de <span className="font-semibold text-text-primary">{agent?.name || "tu asesor asignado"}</span>. Hemos habilitado el chat de soporte interno de TodoVisa para que te comuniques de inmediato.
                    </p>
                  ) : (
                    <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
                      Has contratado la asesoría de <span className="font-semibold text-text-primary">{agent?.name || "tu asesor asignado"}</span> con éxito. Para comenzar a chatear, debes completar primero la Evaluación Diagnóstica VIPRO.
                    </p>
                  )}
                </div>
                {user?.viproCompleted ? (
                  <div className="w-full bg-brand-light/35 border border-brand-primary/10 rounded p-4 text-left flex items-center gap-3">
                    <span className="text-xl">💬</span>
                    <div>
                      <p className="text-xs font-bold text-brand-primary">Chat Habilitado</p>
                      <p className="text-[10px] text-text-secondary leading-normal">
                        Puedes acceder a la conversación desde la pestaña &quot;Mi Asesor Asignado&quot; en tu perfil.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-amber-50 border border-amber-200 rounded p-4 text-left flex items-center gap-3">
                    <span className="text-xl">📊</span>
                    <div>
                      <p className="text-xs font-bold text-amber-800">Evaluación VIPRO Requerida</p>
                      <p className="text-[10px] text-amber-700 leading-normal">
                        Tu asesor asignado necesita conocer tu perfil y puntaje VIPRO para poder iniciar el chat.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => {
                onSuccess();
              }}
              className="w-full py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm shadow-sm transition-colors focus:outline-none cursor-pointer"
            >
              {isVipro 
                ? "Comenzar Evaluación VIPRO" 
                : (user?.viproCompleted 
                    ? `Comenzar Chat con ${agent?.name.split(" ")[1] || "Asesor"}` 
                    : "Ver mi Perfil y Completar VIPRO"
                  )
              }
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
