"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import { AgencyClientService } from "@/services/client/AgencyClientService";
import { CompanyReferralModal } from "../components/shared/CompanyReferralModal";

function ReferralContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [referralCode, setReferralCode] = useState("");
  const [agencyInfo, setAgencyInfo] = useState<{ agencyName?: string; agencyId?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const code =
      searchParams.get("ref") ||
      searchParams.get("code") ||
      searchParams.get("agency") ||
      (typeof window !== "undefined" ? localStorage.getItem("todovisa_agency_ref") : null) ||
      "";

    if (code) {
      setReferralCode(code);
      AgencyClientService.validateAgencyCode(code).then((res) => {
        setLoading(false);
        if (res.valid) {
          setAgencyInfo({ agencyName: res.agencyName, agencyId: res.agencyId });
          AgencyClientService.processAndStoreAgencyCode(code);
        }
      });
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col bg-background-main text-slate-900 font-sans">
      <Header />

      <main className="flex-1 pt-24 pb-14 px-4 max-w-4xl mx-auto w-full text-left">
        {/* Banner de Referido - Término Medio */}
        <div className="bg-white border border-slate-300 rounded-sm p-6 sm:p-8 shadow-xs mb-6">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="px-2.5 py-1 bg-brand-light text-brand-primary text-[11px] font-bold uppercase tracking-wider rounded-sm">
              🏢 Enlace de Referido Empresa
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 leading-tight">
            Atención Consular Especializada TodoVisa
          </h1>

          {loading ? (
            <p className="text-xs font-semibold text-slate-600 animate-pulse">Cargando datos de la empresa aliada...</p>
          ) : agencyInfo ? (
            <div className="bg-amber-50 border border-amber-300 rounded-sm p-4 text-xs sm:text-sm text-amber-950 leading-relaxed font-semibold mb-5">
              Has ingresado mediante el código de la empresa aliada: <strong className="font-bold text-amber-950 uppercase">{agencyInfo.agencyName}</strong> (<span className="font-mono font-bold">{referralCode}</span>). Al enviar tus datos de contacto, un <strong>asesor propio de TodoVisa</strong> se pondrá en contacto directo contigo para gestionar tu proceso.
            </div>
          ) : (
            <p className="text-xs sm:text-sm font-semibold text-slate-700 leading-relaxed mb-5">
              Ingresa tus datos de contacto indicando el código de la empresa o agencia que te recomendó TodoVisa. Un <strong>asesor oficial de TodoVisa</strong> te atenderá personalmente.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs sm:text-sm font-bold rounded-sm border-none cursor-pointer flex items-center gap-2 shadow-xs transition-colors"
            >
              <span>📋 Llenar Formulario de Contacto</span>
            </button>

            <button
              onClick={() => router.push("/visas/us")}
              className="px-5 py-2.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-semibold rounded-sm cursor-pointer transition-colors"
            >
              Ver Requisitos de Visa
            </button>
          </div>
        </div>

        {/* Pasos explicativos en término medio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-2">
            <div className="w-8 h-8 bg-brand-light text-brand-primary font-bold text-xs rounded-sm flex items-center justify-center">
              1
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">Completa el Formulario</h3>
            <p className="text-xs font-medium text-slate-700 leading-relaxed">
              Ingresa tu nombre, WhatsApp y código de empresa. Tus datos quedan vinculados de forma transparente.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-2">
            <div className="w-8 h-8 bg-brand-light text-brand-primary font-bold text-xs rounded-sm flex items-center justify-center">
              2
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">Contacto de Asesor TodoVisa</h3>
            <p className="text-xs font-medium text-slate-700 leading-relaxed">
              Un <strong>asesor exclusivo de TodoVisa</strong> te contactará para guiarte y solicitar tus documentos.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm p-5 space-y-2">
            <div className="w-8 h-8 bg-brand-light text-brand-primary font-bold text-xs rounded-sm flex items-center justify-center">
              3
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">Asignación de Comisión Admin</h3>
            <p className="text-xs font-medium text-slate-700 leading-relaxed">
              Al concretar el pago, el equipo administrador asigna manualmente la comisión correspondiente a la empresa.
            </p>
          </div>
        </div>
      </main>

      <CompanyReferralModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCode={referralCode}
      />

      <Footer />
    </div>
  );
}

export default function ReferralPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background-main text-slate-900 font-bold flex items-center justify-center text-xs">Cargando portal...</div>}>
      <ReferralContent />
    </Suspense>
  );
}
