"use client";

import React, { useRef, useState, useEffect } from "react";
import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import Link from "next/link";
import Image from "next/image";
import { getCentralizedDestinations } from "../constants/visas/destinations";
import { getSystemConfig } from "../constants/config";

export default function AboutUsPage() {
  const headerRef = useRef(null);
  const [viproPrice, setViproPrice] = useState(() => getSystemConfig().viproPrice);
  const [activeDestinations, setActiveDestinations] = useState(() => getCentralizedDestinations());

  useEffect(() => {
    setViproPrice(getSystemConfig().viproPrice);
    setActiveDestinations(getCentralizedDestinations());

    const handleStorage = () => {
      setViproPrice(getSystemConfig().viproPrice);
      setActiveDestinations(getCentralizedDestinations());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const stats = [
    { label: "Solicitudes Evaluadas", value: "1,000+", detail: "Procesadas con VIPRO" },
    { label: "Tasa de Conformidad", value: "98.4%", detail: "Satisfacción de clientes" },
    { label: "Destinos Principales", value: "5 Países", detail: "EE.UU., CA, AU, UK, MX" },
    { label: "Asesores Certificados", value: "120+", detail: "Especialistas en red" },
  ];

  const pillars = [
    {
      icon: "🧠",
      title: "Inteligencia Consular Predictiva (VIPRO)",
      description: "Desarrollamos el algoritmo VIPRO para evaluar solvencia, lazos de arraigo laboral/familiar y perfil de riesgo de forma objetiva antes de ingresar una solicitud oficial ante las embajadas."
    },
    {
      icon: "🛡️",
      title: "Red de Asesores Certificados",
      description: "Conectamos a cada solicitante con consultores expertos independientes que realizan auditorías exhaustivas del expediente, llenado perfecto de DS-160 y simulacros intensivos de entrevista por Zoom."
    },
    {
      icon: "⚡",
      title: "Optimización de Renovaciones",
      description: "Identificamos elegibilidad inmediata para programas de Exención de Entrevista (Drop Box Waiver en EE.UU.) y gestión y acompañamiento ágil de bajo riesgo migratorio para Canadá, Australia, México y el Reino Unido."
    },
    {
      icon: "🔒",
      title: "Privacidad y Seguridad Garantizada",
      description: "Tratamiento confidencial de la información con estándares bancarios de encriptación y protección de datos para la tranquilidad de cada familia y viajero."
    }
  ];

  const destinations = activeDestinations.map(d => ({
    name: d.name,
    flag: d.flag,
    desc: d.aboutDesc || d.description
  }));

  return (
    <div className="min-h-screen w-full flex flex-col bg-background-main font-sans">
      <Header headerRef={headerRef} />

      <main className="flex-1 w-full">
        {/* HERO SECTION */}
        <section className="w-full text-white py-16 md:py-24 px-6 relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('/images/about_hero_bg.png')" }}>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/95 via-brand-primary/90 to-brand-primary/95"></div>
          <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10 space-y-6">
            <span className="bg-white/10 text-white font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/20">
              Acerca de TodoVisa
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight tracking-tight italic">
              Reinventando la consultoría migratoria con tecnología y rigor consular.
            </h1>
            <p className="text-base md:text-lg text-white/90 max-w-3xl font-medium leading-relaxed">
              Combinamos inteligencia algorítmica predictiva (VIPRO) con una red global de asesores certificados para transformar la incertidumbre en expedientes sólidos y solicitudes exitosas.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link
                href="/vipro-form"
                className="bg-white text-brand-primary hover:bg-brand-light font-bold px-8 py-3.5 rounded-lg text-sm transition-all shadow-md"
              >
                Diagnóstico VIPRO (${viproPrice.toFixed(2)} USD) →
              </Link>
              <Link
                href="/agents"
                className="bg-transparent hover:bg-white/10 text-white font-bold px-8 py-3.5 rounded-lg text-sm transition-all border border-white/30"
              >
                Conocer Red de Asesores
              </Link>
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <section className="w-full bg-white border-b border-border-light py-10 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <span className="block text-3xl md:text-4xl font-extrabold text-brand-primary font-mono">{stat.value}</span>
                <span className="block text-xs font-bold text-text-primary uppercase tracking-wider">{stat.label}</span>
                <span className="block text-[11px] text-text-secondary">{stat.detail}</span>
              </div>
            ))}
          </div>
        </section>

        {/* MISIÓN & VISIÓN */}
        <section className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">NUESTRA ESENCIA</span>
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight font-serif italic">
                Nacidos para eliminar la incertidumbre en procesos de visa.
              </h2>
              <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                TodoVisa surgió al identificar que miles de solicitudes de visa son rechazadas no por falta de solvencia o lazos de arraigo, sino por errores en el llenado de formularios, expedientes incompletos o falta de preparación previa para la entrevista consular.
              </p>
              <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                Nuestra misión es brindar claridad absoluta a cada viajero mediante diagnósticos oportunos y acompañamiento profesional con Asesores Expertos de principio a fin.
              </p>
            </div>

            <div className="bg-brand-light/40 border border-brand-primary/20 rounded-3xl p-8 md:p-10 space-y-6 text-left shadow-sm">
              <div className="space-y-2">
                <span className="text-2xl">🎯</span>
                <h3 className="text-xl font-bold text-text-primary">Nuestra Misión</h3>
                <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
                  Proporcionar herramientas tecnológicas de análisis consular y conectar a los usuarios con asesores altamente capacitados para maximizar las probabilidades de aprobación de sus visados.
                </p>
              </div>

              <div className="border-t border-brand-primary/10 pt-6 space-y-2">
                <span className="text-2xl">🌟</span>
                <h3 className="text-xl font-bold text-text-primary">Nuestra Visión</h3>
                <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
                  Ser la plataforma digital líder en consultoría consular en América Latina y el mundo, reconocida por su rigor técnico, transparencia comercial y excelencia en el servicio al cliente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PILARES OPERATIVOS */}
        <section className="w-full bg-white py-16 md:py-24 px-6 border-y border-border-light">
          <div className="max-w-6xl mx-auto space-y-12 text-center">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">POR QUÉ ELEGIRNOS</span>
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary font-serif italic">
                Nuestros Pilares de Excelencia Consular
              </h2>
              <p className="text-sm text-text-secondary max-w-2xl mx-auto">
                Combinamos inteligencia artificial predictiva con el criterio experto de consultores verificados.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {pillars.map((pilar, idx) => (
                <div
                  key={idx}
                  className="bg-background-main border border-border-light rounded-2xl p-6 space-y-4 hover:border-brand-primary/40 transition-all duration-200 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <span className="text-3xl">{pilar.icon}</span>
                    <h3 className="text-base font-bold text-text-primary leading-snug">{pilar.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">{pilar.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DESTINOS QUE ATENDEMOS */}
        <section className="max-w-6xl mx-auto px-6 py-16 md:py-24 text-center space-y-12">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">COBERURA GLOBAL</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary font-serif italic">
              Especialistas en {destinations.length} Destinos Internacionales
            </h2>
            <p className="text-sm text-text-secondary max-w-2xl mx-auto">
              Gestionamos procesos de primera vez y programas de renovación agilizada para los principales destinos del mundo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {destinations.map((dest, idx) => (
              <div
                key={idx}
                className="bg-white border border-border-light rounded-2xl p-6 space-y-3 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{dest.flag}</span>
                  <h3 className="text-lg font-bold text-text-primary">{dest.name}</h3>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{dest.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CALL TO ACTION FINAL */}
        <section className="w-full bg-brand-primary text-white py-16 px-6 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif italic font-bold">
              ¿Listo para asegurar la aprobación de tu visa?
            </h2>
            <p className="text-sm md:text-base text-white/90 max-w-2xl mx-auto leading-relaxed">
              Inicia tu evaluación diagnóstica con VIPRO o solicita el acompañamiento con Asesores Expertos de principio a fin.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link
                href="/vipro-form"
                className="bg-white text-brand-primary hover:bg-brand-light font-bold px-8 py-3.5 rounded-lg text-sm transition-all shadow-md"
              >
                Comenzar Evaluación VIPRO
              </Link>
              <Link
                href="/agents"
                className="bg-transparent hover:bg-white/10 text-white font-bold px-8 py-3.5 rounded-lg text-sm transition-all border border-white/30"
              >
                Iniciar Preformulario de Visado
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
