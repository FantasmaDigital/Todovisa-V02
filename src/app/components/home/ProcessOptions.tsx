"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';

const processOptions = {
  servicioCompleto: {
    title: "Servicio Completo",
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    steps: [
      {
        title: "Paso 1: Formulario DS-160 Completo",
        description: "Llenamos digitalmente tu formulario oficial sin errores de perfilamiento ni inconsistencias de solvencia."
      },
      {
        title: "Paso 2: Auditoría y Documentación",
        description: "Cotejamos tus constancias laborales, estados bancarios y pasaportes para blindar tu expediente."
      },
      {
        title: "Paso 3: Simulacros Zoom y Citas",
        description: "Agendamos las fechas en el consulado y realizamos simulaciones intensivas con preguntas reales."
      }
    ]
  },
  autonomia: {
    title: "Evaluación VIPRO",
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    steps: [
      {
        title: "Paso 1: Respuestas Express",
        description: "Completa el cuestionario interactivo de 10 minutos analizando tu perfil socioeconómico."
      },
      {
        title: "Paso 2: Diagnóstico Algorítmico",
        description: "Obtén un reporte inmediato de viabilidad (0-100 pts) y detección automatizada de debilidades."
      },
      {
        title: "Paso 3: Recomendaciones",
        description: "Recibe sugerencias personalizadas de cómo corregir vulnerabilidades antes de postular."
      }
    ]
  }
};

const timeLabels = ["Fase 1", "Fase 2", "Fase 3"];

export const ProcessSection = () => {
  const [active, setActive] = useState('servicioCompleto');
  const router = useRouter();
  const { user } = useAuthStore();
  const [price, setPrice] = useState(150);
  const [viproPrice, setViproPrice] = useState(19.99);

  useEffect(() => {
    const savedPrice = localStorage.getItem("fullServicePrice");
    if (savedPrice) {
      setPrice(Number(savedPrice));
    }
    const savedViproPrice = localStorage.getItem("viproPrice");
    if (savedViproPrice) {
      setViproPrice(Number(savedViproPrice));
    }

    const handleStorage = () => {
      const saved = localStorage.getItem("fullServicePrice");
      if (saved) {
        setPrice(Number(saved));
      }
      const savedVipro = localStorage.getItem("viproPrice");
      if (savedVipro) {
        setViproPrice(Number(savedVipro));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const discountPrice = price * 0.75;
  const formattedPrice = `$${price.toFixed(2)} USD`;
  const formattedDiscount = `$${discountPrice.toFixed(2)} USD`;
  const formattedViproPrice = `$${viproPrice.toFixed(2)} USD`;

  const planInfo = {
    servicioCompleto: {
      price: user?.hasPaidVipro ? formattedDiscount : formattedPrice,
      promo: user?.hasPaidVipro ? "¡Descuento VIPRO del 25% aplicado!" : "Obtén acompañamiento integral",
      description: "La solución completa que incluye el llenado guiado de tu formulario oficial DS-160, asesoramiento integral y simulacros de entrevista virtual con un asesor asignado.",
      buttonText: "Explorar Agentes y Contratar",
      action: () => router.push("/agents")
    },
    autonomia: {
      price: formattedViproPrice,
      promo: "25% de reembolso si contratas Asesoría VIP después",
      description: "Accede de forma independiente a la Evaluación Diagnóstica VIPRO para obtener un escaneo automatizado de tus fortalezas y debilidades perfiladas.",
      buttonText: "Adquirir Evaluación Express",
      action: () => router.push("/vipro-form")
    }
  };

  return (
    <section id="como-funciona" className="py-32 w-[95%] max-w-7xl m-auto font-sans">
      <div className="text-center mb-16">
        <p className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-4">
          CÓMO FUNCIONA EL PROCESO
        </p>
        <h2 className="text-5xl md:text-6xl leading-tight font-bold text-gray-900 tracking-tight">
          Logra tu meta en menos tiempo
        </h2>
      </div>
      
      <div className="flex justify-center gap-4 mb-24 flex-wrap">
        {Object.keys(processOptions).map((key) => {
          const isActive = active === key;
          return (
            <button 
              key={key}
              onClick={() => setActive(key)}
              className={`flex items-center px-8 py-3.5 rounded-full text-base md:text-lg font-bold transition-all duration-300 cursor-pointer border-none ${
                isActive 
                  ? 'bg-brand-primary text-white shadow-lg scale-105' 
                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-brand-light/50 border border-border-light'
              }`}
            >
              {processOptions[key as keyof typeof processOptions].icon}
              {processOptions[key as keyof typeof processOptions].title}
            </button>
          );
        })}
      </div>

      <div className="relative max-w-6xl mx-auto mt-12">
        
        {/* Línea punteada de fondo */}
        <div className="absolute top-[6px] left-[16.6%] right-[16.6%] h-[2px] border-t-[2px] border-dashed border-brand-primary/20 -z-10 hidden md:block"></div>
        
        <div className="flex flex-col md:flex-row justify-between relative z-10 gap-12 md:gap-8">
          {processOptions[active as keyof typeof processOptions].steps.map((step, index) => (
            <div
              key={`${active}-step-${index}`}
              className="flex flex-col items-center w-full md:w-1/3 px-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 120}ms`, animationFillMode: 'both' }}
            >
              
              <div className="w-4 h-4 bg-brand-primary rounded-full mb-10 hidden md:block ring-[6px] ring-white shadow-xs"></div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-6 font-serif">
                {timeLabels[index]}
              </h3>
              
              <div className="bg-[#EFF6FF] border border-brand-primary/10 px-8 py-10 rounded-2xl w-full max-w-[360px] min-h-[200px] flex flex-col items-center justify-center text-center shadow-xs hover:shadow-md hover:-translate-y-1.5 transition-all duration-300">
                <h4 className="text-[19px] font-bold text-gray-900 mb-3 leading-snug">
                  {step.title}
                </h4>
                <p className="text-sm font-medium text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
              
            </div>
          ))}
        </div>
      </div>

      {/* Plan Details Card */}
      <div
        key={`${active}-plan-details`}
        className="w-full bg-brand-primary rounded-sm px-8 py-10 md:py-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 animate-in fade-in-0 slide-in-from-bottom-3 duration-500 mt-20"
      >
        {/* Background grid */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none select-none"></div>

        <div className="flex-1 space-y-4 text-center md:text-left relative z-10">
          <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-white/90 bg-white/10 px-3.5 py-1 rounded-full border border-white/25 backdrop-blur-xs">
            {planInfo[active as keyof typeof planInfo].promo}
          </span>
          <h4 className="text-3xl md:text-4xl font-bold text-white font-serif italic">
            {processOptions[active as keyof typeof processOptions].title}
          </h4>
          <p className="text-sm md:text-base text-white/90 leading-relaxed max-w-2xl font-light">
            {planInfo[active as keyof typeof planInfo].description}
          </p>
        </div>
        <div className="flex flex-col items-center md:items-end justify-center gap-4 flex-shrink-0 w-full md:w-auto relative z-10">
          <div className="text-center md:text-right">
            <p className="text-4xl font-black text-white font-mono tracking-tight">
              {planInfo[active as keyof typeof planInfo].price}
            </p>
            <p className="text-xs text-white/60 font-medium">Pago único y transparente</p>
          </div>
          <button
            onClick={planInfo[active as keyof typeof planInfo].action}
            className="w-full md:w-auto px-8 py-4 bg-white hover:bg-gray-100 text-brand-primary font-bold text-sm rounded-sm transition-all focus:outline-none cursor-pointer text-center border-none shadow-md"
          >
            {planInfo[active as keyof typeof planInfo].buttonText}
          </button>
        </div>
      </div>
    </section>
  );
};