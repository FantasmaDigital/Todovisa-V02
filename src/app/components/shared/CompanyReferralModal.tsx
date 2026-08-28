"use client";

import React, { useState, useEffect } from "react";
import { AgencyClientService } from "@/services/client/AgencyClientService";
import { useAuthStore } from "@/app/store/authStore";

interface CompanyReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  onSuccess?: () => void;
}

export function CompanyReferralModal({
  isOpen,
  onClose,
  initialCode = "",
  onSuccess,
}: CompanyReferralModalProps) {
  const { user } = useAuthStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [visaType, setVisaType] = useState("Turismo / Negocios (B1/B2)");
  const [destinationCountry, setDestinationCountry] = useState("Estados Unidos");
  const [referralCode, setReferralCode] = useState(initialCode);
  const [notes, setNotes] = useState("");

  const [validatingCode, setValidatingCode] = useState(false);
  const [agencyInfo, setAgencyInfo] = useState<{ agencyName?: string; agencyId?: string } | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [assignedAgencyName, setAssignedAgencyName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (user) {
      setFullName((prev) => prev || `${user.firstName || ""} ${user.lastName || ""}`.trim());
      setEmail((prev) => prev || user.email || "");
      setPhone((prev) => prev || user.phone || "");
    }

    const codeToTest = initialCode || (typeof window !== "undefined" ? localStorage.getItem("todovisa_agency_ref") : null) || "";
    if (codeToTest) {
      setReferralCode(codeToTest);
      handleValidateCode(codeToTest);
    }
  }, [isOpen, initialCode, user]);

  const handleValidateCode = async (code: string) => {
    if (!code || !code.trim()) {
      setAgencyInfo(null);
      setCodeError(null);
      return;
    }

    setValidatingCode(true);
    setCodeError(null);

    const result = await AgencyClientService.validateAgencyCode(code.trim());
    setValidatingCode(false);

    if (result.valid) {
      setAgencyInfo({
        agencyName: result.agencyName,
        agencyId: result.agencyId,
      });
      setCodeError(null);
    } else {
      setAgencyInfo(null);
      setCodeError(result.error || "Código de empresa inválido");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError("Por favor ingresa tu nombre completo.");
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setFormError("Ingresa al menos un correo electrónico o un número de WhatsApp.");
      return;
    }

    if (!referralCode.trim()) {
      setFormError("Por favor ingresa o valida el código de referido de la empresa.");
      return;
    }

    setSubmitting(true);

    const result = await AgencyClientService.submitReferralLead({
      client_name: fullName.trim(),
      client_email: email.trim(),
      client_phone: phone.trim(),
      visa_type: visaType,
      destination_country: destinationCountry,
      agency_code: referralCode.trim(),
      notes: notes.trim(),
    });

    setSubmitting(false);

    if (result.success) {
      AgencyClientService.processAndStoreAgencyCode(referralCode.trim(), user?.id);
      setSubmitSuccess(true);
      setAssignedAgencyName(result.agencyName || agencyInfo?.agencyName || "la empresa aliada");
      if (onSuccess) onSuccess();
    } else {
      setFormError(result.error || "No se pudo procesar la solicitud. Revisa tus datos e intenta nuevamente.");
    }
  };

  const handleResetAndClose = () => {
    setSubmitSuccess(false);
    setFormError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-slate-300 rounded-sm shadow-xl overflow-hidden text-left my-auto">
        
        {/* Header Modal - Término Medio */}
        <div className="bg-brand-primary p-4 sm:p-5 text-white flex items-center justify-between border-b border-brand-hover">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/20 text-white rounded-xs text-[11px] font-bold uppercase tracking-wider mb-1">
              <span>📋 REFERIDO CORPORATIVO</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
              Solicitud de Atención por Asesor TodoVisa
            </h2>
          </div>

          <button
            onClick={handleResetAndClose}
            className="text-white hover:bg-white/10 p-1.5 rounded-sm transition-colors cursor-pointer border-none bg-transparent"
            aria-label="Cerrar modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body - Término Medio */}
        <div className="p-5 sm:p-6 bg-white space-y-4">
          {submitSuccess ? (
            /* Confirmación de éxito */
            <div className="py-3 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  ¡Solicitud Enviada con Éxito!
                </h3>
                <p className="text-xs font-bold text-brand-primary mt-1">
                  Empresa Vinculada: <span className="uppercase underline font-extrabold">{assignedAgencyName}</span>
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm text-left text-xs space-y-2">
                <p className="text-slate-800 font-semibold leading-relaxed">
                  ✓ Un <strong>asesor propio de TodoVisa</strong> se pondrá en contacto directo contigo vía teléfono o WhatsApp para dar seguimiento y finalizar tu proceso de visa.
                </p>
                <p className="text-slate-600 font-medium text-[11px] leading-relaxed pt-2 border-t border-slate-200">
                  ★ La empresa referidora queda registrada en tu expediente y la comisión correspondiente se asignará desde nuestro módulo de administración al completarse el proceso.
                </p>
              </div>

              <button
                onClick={handleResetAndClose}
                className="w-full py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-all cursor-pointer border-none shadow-xs"
              >
                Entendido
              </button>
            </div>
          ) : (
            /* Formulario */
            <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-sm flex items-center gap-2">
                  <span>⚠️ {formError}</span>
                </div>
              )}

              {/* Código de Empresa */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Código de Empresa o Referido *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => {
                      setReferralCode(e.target.value);
                      handleValidateCode(e.target.value);
                    }}
                    placeholder="Ej. AGENCIA-SAN-SALVADOR"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs sm:text-sm font-mono font-bold text-slate-900 focus:bg-white focus:border-brand-primary focus:outline-none uppercase placeholder:text-slate-400"
                  />
                  {validatingCode && (
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">Verificando...</span>
                  )}
                </div>

                {agencyInfo && (
                  <div className="p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-sm mt-1 flex items-center gap-1.5">
                    <span>✓ Empresa confirmada: <strong>{agencyInfo.agencyName}</strong></span>
                  </div>
                )}
                {codeError && (
                  <p className="text-xs font-bold text-red-600 mt-1">{codeError}</p>
                )}
              </div>

              {/* Nombre Completo */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Nombre Completo del Solicitante *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. María Fernanda López"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-brand-primary focus:outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Correo y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@ejemplo.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-brand-primary focus:outline-none placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+503 7000 0000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-brand-primary focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Tipo de Visa y País */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Tipo de Proceso / Visa
                  </label>
                  <select
                    value={visaType}
                    onChange={(e) => setVisaType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-brand-primary focus:outline-none"
                  >
                    <option value="Turismo / Negocios (B1/B2)">Turismo / Negocios (B1/B2)</option>
                    <option value="Visa de Estudiante (F1/M1)">Visa de Estudiante (F1/M1)</option>
                    <option value="Visa de Trabajo (H1B/H2B/O1)">Visa de Trabajo</option>
                    <option value="Residencia / Petición Familiar">Petición Familiar</option>
                    <option value="Renovación de Visa">Renovación de Visa</option>
                    <option value="Otro tipo de Proceso">Otro tipo de Proceso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    País de Destino
                  </label>
                  <select
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-brand-primary focus:outline-none"
                  >
                    <option value="Estados Unidos">Estados Unidos</option>
                    <option value="Canadá">Canadá</option>
                    <option value="Reino Unido">Reino Unido</option>
                    <option value="Europa / Schengen">Europa (Schengen)</option>
                    <option value="México">México</option>
                    <option value="Otro País">Otro País</option>
                  </select>
                </div>
              </div>

              {/* Comentarios */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Notas o Comentarios Adicionales
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles sobre tu viaje, horario preferido de llamada, etc."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-sm text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:border-brand-primary focus:outline-none resize-none placeholder:text-slate-400"
                />
              </div>

              <div className="pt-1.5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs sm:text-sm font-bold rounded-sm transition-all cursor-pointer border-none shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Enviando Formulario...</span>
                  ) : (
                    <span>Enviar Formulario a Asesor TodoVisa</span>
                  )}
                </button>
              </div>

              <p className="text-[11px] font-semibold text-center text-slate-600 mt-2 leading-relaxed">
                🔒 Al enviar este formulario, los datos quedan vinculados a la empresa referidora y un <strong className="text-slate-800">asesor propio de TodoVisa</strong> te contactará directamente.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
