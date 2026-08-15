"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_PRICING, getSystemConfig } from "@/app/constants/config";

export const AgencyPromoBanner = () => {
  const [agencyRate, setAgencyRate] = useState(DEFAULT_PRICING.agencyReferralRate);

  useEffect(() => {
    setAgencyRate(getSystemConfig().agencyReferralRate);

    const handleStorage = () => {
      setAgencyRate(getSystemConfig().agencyReferralRate);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <section className="w-[98%] max-w-7xl mx-auto my-8 px-2">
      <Link href="/agents/apply" className="block group cursor-pointer no-underline">
        <div className="bg-[#0C1633] border border-blue-900/50 rounded-xl md:rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-300 group-hover:border-amber-500/40 group-hover:shadow-amber-500/10">
          {/* Background subtle radial gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-center relative z-10">
            {/* Left Column */}
            <div className="lg:col-span-8 text-left space-y-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-[#C6A035]/60 bg-[#1D1B13] text-[#E6C65A] text-xs font-extrabold uppercase tracking-wide">
                <span>🏢</span>
                <span>PROGRAMA ESPECIAL PARA AGENCIAS B2B</span>
              </div>

              {/* Heading */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                ¿Eres una Agencia de Viajes o Turismo?
              </h2>

              {/* Paragraph */}
              <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-3xl font-normal">
                Monetiza tus clientes referidos sin preocuparte por la gestión técnica consular. Obtén tu{" "}
                <strong className="text-white font-bold">Enlace Exclusivo de Agencia</strong> para compartir con tus clientes y gana un{" "}
                <strong className="text-amber-400 font-bold">{agencyRate}% de comisión directa</strong> por cada venta generada automáticamente.
              </p>
            </div>

            {/* Right Card */}
            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <div className="w-full max-w-xs bg-[#19274D]/80 border border-blue-400/20 backdrop-blur-sm rounded-xl p-6 md:p-7 text-center shadow-lg transition-all duration-300 group-hover:bg-[#1D2E5C]">
                <div className="text-5xl md:text-6xl font-extrabold text-[#FFD700] font-mono tracking-tight mb-2">
                  {agencyRate}%
                </div>
                <div className="text-white text-xs md:text-sm font-bold uppercase tracking-wider mb-1">
                  COMISIÓN POR REFERIDO
                </div>
                <div className="text-blue-200/70 text-xs">
                  Enlace personalizado único
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
};
