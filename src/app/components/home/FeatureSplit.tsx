'use client';

import React from 'react';
import Link from 'next/link';

export function FeatureSplit({ refHeaderHeight }: { refHeaderHeight?: any }) {
  return (
    <section className="w-full bg-background-main py-16 md:py-24 space-y-20 font-sans">
      {/* Section 1: Asesoría Virtual */}
      <div id="asesoria-virtual" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div className="w-full lg:w-1/2">
            <div className="rounded-xl relative w-full aspect-[4/5] md:aspect-square overflow-hidden border border-border-light bg-white shadow-xs">
              <img
                src="/images/virtual-meet.webp"
                alt="Agentes Virtuales TODOVISA"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary mb-4">
              ASESORÍA VIRTUAL
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
              Conecta con expertos<br />desde donde estés
            </h2>
            <p className="text-base md:text-lg text-text-secondary mb-8 leading-relaxed max-w-lg font-medium">
              Resuelve todas tus dudas y prepara tu proceso migratorio desde la comodidad de tu hogar. Nuestro sistema de agentes virtuales te guía paso a paso de forma rápida, segura y confidencial.
            </p>
            <Link href="/agents" className="bg-brand-primary text-white font-semibold px-8 py-3.5 rounded-sm hover:bg-[#0f3755] transition-colors text-sm shadow-xs inline-block">
              Conectar con un agente
            </Link>
          </div>
        </div>
      </div>

      {/* Section 2: Evaluación VIPRO */}
      <div id="evaluacion-vipro" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 border-t border-border-light/60">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-16">
          <div className="w-full lg:w-1/2">
            <div className="rounded-xl relative w-full aspect-[4/5] md:aspect-square overflow-hidden border border-border-light bg-white shadow-xs">
              <img
                src="/images/viproform.webp"
                alt="Formulario VIPRO TODOVISA"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
            <span className="text-xs font-bold tracking-[0.2em] text-brand-primary mb-4">
              EVALUACIÓN VIPRO
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
              Descubre tu nivel<br />de preparación
            </h2>
            <p className="text-base md:text-lg text-text-secondary mb-8 leading-relaxed max-w-lg font-medium">
              Completa nuestro Formulario VIPRO para evaluar tu perfil en minutos. Al finalizar, recibirás un diagnóstico preliminar y un 25% de descuento para tu asesoría personalizada.
            </p>
            <Link href="/vipro-form" className="bg-brand-primary text-white font-semibold px-8 py-3.5 rounded-sm hover:bg-[#0f3755] transition-colors text-sm shadow-xs inline-block">
              Iniciar evaluación VIPRO
            </Link>
          </div>
        </div>
      </div>

      {/* Section 3: Atención 100% Virtual */}
      <div id="cita-virtual" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 border-t border-border-light/60">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div className="w-full lg:w-1/2">
            <div className="rounded-xl relative w-full aspect-[4/5] md:aspect-square overflow-hidden border border-border-light bg-white shadow-xs">
              <img
                src="/images/office-agents.webp"
                alt="Asesoría Virtual TODOVISA"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary mb-4">
              ATENCIÓN 100% VIRTUAL
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
              Agenda tu asesoría<br />online
            </h2>
            <p className="text-base md:text-lg text-text-secondary mb-8 leading-relaxed max-w-lg font-medium">
              Resuelve tus dudas desde la comodidad de tu hogar. Conéctate con un especialista certificado a través de una videollamada segura (Google Meet o Zoom) para revisar tu perfil y definir tu estrategia sin necesidad de trasladarte.
            </p>
            <Link href="/citas" className="bg-brand-primary text-white font-semibold px-8 py-3.5 rounded-sm hover:bg-[#0f3755] transition-colors text-sm shadow-xs inline-block">
              Agendar asesoría virtual
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
