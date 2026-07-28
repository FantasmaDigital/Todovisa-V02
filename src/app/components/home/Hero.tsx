"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export const Hero = ({ headerHeight }: { headerHeight: number | null }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay to ensure the browser registers the initial layout before animating
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="relative w-[98%] m-auto rounded-xl bg-[#0B1520] overflow-hidden"
      style={{ height: `calc(98dvh - ${headerHeight}px)`, minHeight: "600px" }}
    >
      {/* Background — clipped to rounded corners, pointer-events off so overlay doesn't block */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none select-none">
        <img
          src="/images/backgrounds/visa_hero_bg.png"
          alt="Fondo de destino TodoVisa"
          className={`w-full h-full object-cover object-center transition-all duration-[3000ms] ease-out ${
            mounted ? "scale-100 opacity-80" : "scale-105 opacity-0"
          }`}
        />
        <div className={`absolute inset-0 bg-gradient-to-t from-[#0B1520] via-[#0B1520]/50 to-[#0B1520]/20 transition-opacity duration-1000 ${
          mounted ? "opacity-100" : "opacity-0"
        }`} />
      </div>

      {/* Content layer */}
      <section
        className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 max-w-4xl mx-auto space-y-6"
        style={{ zIndex: 10 }}
      >
        {/* Rating Badge */}
        <div className={`inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-xs font-semibold text-white/90 shadow-sm transition-all duration-1000 ease-out ${
          mounted ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}>
          <span className="flex items-center gap-1 text-amber-300">
            ★ ★ ★ ★ ★
          </span>
          <span className="font-medium">4.9/5 por +15,000 trámites evaluados</span>
        </div>

        {/* Heading */}
        <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.15] tracking-tight font-serif max-w-3xl transition-all duration-1000 ease-out delay-200 ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}>
          Consigue tu visa con seguridad, inteligencia consular y acompañamiento experto.
        </h1>
        
        {/* Subtitle */}
        <p className={`text-base md:text-lg text-white/80 max-w-2xl font-light leading-relaxed transition-all duration-1000 ease-out delay-500 ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}>
          Diagnostica tu viabilidad consular con VIPRO o conéctate con un asesor certificado para garantizar una solicitud sólida y libre de errores.
        </p>

        {/* Call-to-Action buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 pt-4 justify-center items-center w-full max-w-md transition-all duration-1000 ease-out delay-700 ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}>
          <Link
            href="/vipro-form"
            className="w-full sm:w-auto bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-8 py-3.5 rounded-sm transition-all text-center shadow-lg hover:shadow-brand-primary/20 hover:-translate-y-0.5"
          >
            Iniciar Evaluación VIPRO
          </Link>
          <Link
            href="/agents"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold px-8 py-3.5 rounded-sm transition-all text-center backdrop-blur-xs hover:-translate-y-0.5"
          >
            Conectar con Asesor Certificado
          </Link>
        </div>
      </section>
    </div>
  );
};