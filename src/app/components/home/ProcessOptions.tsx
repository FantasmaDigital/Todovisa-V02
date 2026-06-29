"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';

const processOptions = {
  servicioCompleto: {
    title: "Servicio Completo",
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
    steps: [
      {
        title: "Llena tu formulario VIPRO",
        description: "Completa nuestra evaluación digital con tus datos y antecedentes para analizar tu caso a profundidad."
      },
      {
        title: "Agenda cita con un agente",
        description: "Elige el horario ideal para revisar tu expediente junto a un experto en perfilamiento consular."
      },
      {
        title: "Prepárate para tu visa",
        description: "Realiza simulacros de entrevista y organiza tu documentación para presentarte a la embajada con total seguridad."
      }
    ]
  },
  autonomia: {
    title: "Evaluación Express",
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    ),
    steps: [
      {
        title: "Llena tu formulario VIPRO",
        description: "Proporciona tu información básica de viaje para un escaneo rápido de tus probabilidades de aprobación."
      },
      {
        title: "Recibe consejos de mejora",
        description: "Obtén un reporte detallado con las fortalezas y áreas de oportunidad detectadas en tu perfil."
      },
      {
        title: "Optimiza tu perfil",
        description: "Aplica nuestras recomendaciones clave antes de iniciar tu proceso formal de solicitud."
      }
    ]
  },
  presencial: {
    title: "Asesoría Presencial",
    icon: (
      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    ),
    steps: [
      {
        title: "Visítanos en oficina",
        description: "Acércate a nuestras instalaciones para discutir tu caso cara a cara y resolver cualquier duda."
      },
      {
        title: "Diagnóstico personalizado",
        description: "Revisaremos físicamente tus comprobantes y diseñaremos la estrategia más fuerte para tu perfil."
      },
      {
        title: "Plan de acción guiado",
        description: "Estableceremos un cronograma claro con los pasos exactos a seguir hasta el día de tu cita consular."
      }
    ]
  }
};

const timeLabels = ["Fase 1", "Fase 2", "Fase 3"];

export const ProcessSection = () => {
  const [active, setActive] = useState('servicioCompleto');
  const router = useRouter();
  const { user } = useAuthStore();

  const planInfo = {
    servicioCompleto: {
      price: user?.hasPaidVipro ? "$112.50 USD" : "$150.00 USD",
      promo: user?.hasPaidVipro ? "¡Descuento VIPRO del 25% aplicado!" : "Obtén acompañamiento integral",
      description: "La solución completa que incluye la evaluación diagnóstica VIPRO, el llenado del formulario DS-160 y simulacros de entrevista con un asesor asignado.",
      buttonText: "Explorar Agentes y Contratar",
      action: () => router.push("/agents")
    },
    autonomia: {
      price: "$19.99 USD",
      promo: "25% de reembolso si contratas Asesoría VIP después",
      description: "Accede de forma independiente a la Evaluación Diagnóstica VIPRO para obtener un escaneo automatizado de tus fortalezas y debilidades perfiladas.",
      buttonText: "Adquirir Evaluación Express",
      action: () => router.push("/vipro-form")
    },
    presencial: {
      price: "Cita Presencial",
      promo: "Visítanos en nuestras oficinas físicas",
      description: "Reunión cara a cara en Polanco (CDMX), Providencia (GDL), San Pedro (MTY) o San Salvador con un asesor certificado.",
      buttonText: "Agendar Cita Presencial",
      action: () => router.push("/citas")
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
              className={`flex items-center px-8 py-3.5 rounded-full text-lg font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-[#e1f0ff] text-gray-900 shadow-sm' 
                  : 'bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
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
        <div className="absolute top-[6px] left-[16.6%] right-[16.6%] h-[2px] border-t-[2px] border-dashed border-gray-300 -z-10 hidden md:block"></div>
        
        <div className="flex flex-col md:flex-row justify-between relative z-10 gap-12 md:gap-8">
          {processOptions[active as keyof typeof processOptions].steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center w-full md:w-1/3 px-4">
              
              <div className="w-3.5 h-3.5 bg-gray-300 rounded-full mb-10 hidden md:block ring-[6px] ring-white"></div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                {timeLabels[index]}
              </h3>
              
              <div className="bg-[#e1f0ff] px-8 py-10 rounded-2xl w-full max-w-[360px] min-h-[180px] flex flex-col items-center justify-center text-center shadow-sm transition-all">
                <h4 className="text-[19px] font-bold text-gray-900 mb-3 leading-snug">
                  {step.title}
                </h4>
                <p className="text-base font-medium text-gray-700 leading-relaxed">
                  {step.description}
                </p>
              </div>
              
            </div>
          ))}
        </div>
      </div>

      {/* Plan Details Card */}
      <div className="max-w-3xl mx-auto mt-20 bg-white border border-border-light rounded-3xl p-8 md:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center gap-8 animate-fadeIn">
        <div className="flex-1 space-y-4 text-center md:text-left">
          <span className="inline-block text-xs font-extrabold uppercase tracking-widest text-brand-primary bg-brand-light px-3 py-1 rounded-full">
            {planInfo[active as keyof typeof planInfo].promo}
          </span>
          <h4 className="text-2xl font-bold text-gray-900 font-serif italic">
            {processOptions[active as keyof typeof processOptions].title}
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed max-w-md">
            {planInfo[active as keyof typeof planInfo].description}
          </p>
        </div>
        <div className="flex flex-col items-center md:items-end justify-center gap-4 flex-shrink-0 w-full md:w-auto">
          <div className="text-center md:text-right">
            <p className="text-3xl font-black text-gray-900">
              {planInfo[active as keyof typeof planInfo].price}
            </p>
            <p className="text-xs text-gray-400">Pago único y seguro</p>
          </div>
          <button
            onClick={planInfo[active as keyof typeof planInfo].action}
            className="w-full md:w-auto px-8 py-3.5 bg-brand-primary text-white font-bold text-sm rounded-xl hover:bg-brand-hover shadow-md hover:shadow-lg transition-all focus:outline-none cursor-pointer text-center"
          >
            {planInfo[active as keyof typeof planInfo].buttonText}
          </button>
        </div>
      </div>
    </section>
  );
};