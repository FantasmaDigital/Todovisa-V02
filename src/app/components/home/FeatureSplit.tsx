// @ts-nocheck
'use client';

import { useScroll, useTransform, motion } from 'motion/react';
import { useRef } from 'react';

export function FeatureSplit({ refHeaderHeight }) {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  return (
    <>
      <main ref={container} className='relative h-[300vh] bg-background-main'>
        <Section1 scrollYProgress={scrollYProgress} />
        <Section2 scrollYProgress={scrollYProgress} />
        <Section3 scrollYProgress={scrollYProgress} />
      </main>
    </>
  );
}

const Section1 = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
  const rotate = useTransform(scrollYProgress, [0, 0.5], [0, -5]);
  return (
    <motion.section
      id="asesoria-virtual"
      style={{ scale, rotate, z: 0 }}
      className='sticky top-0 min-h-screen py-12 lg:py-0 bg-background-main flex flex-col items-center justify-center text-text-primary antialiased [transform-style:preserve-3d] [backface-visibility:hidden]'
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 relative z-10">
        <div className="w-full lg:w-1/2">
          <div className="rounded-xl relative w-full aspect-[4/5] md:aspect-square rounded-sm overflow-hidden border border-border-light bg-white">
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
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
            Conecta con expertos<br />desde donde estés
          </h2>
          <p className="text-lg text-text-secondary mb-10 leading-relaxed max-w-lg font-medium">
            Resuelve todas tus dudas y prepara tu trámite migratorio desde la comodidad de tu hogar. Nuestro sistema de agentes virtuales te guía paso a paso de forma rápida, segura y confidencial.
          </p>
          <button className="bg-brand-primary text-white font-semibold px-8 py-3 rounded-sm hover:bg-[#0f3755] transition-colors text-sm">
            Conectar con un agente
          </button>
        </div>
      </div>
    </motion.section>
  );
};

const Section2 = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [5, 0, -5]);

  return (
    <motion.section
      id="evaluacion-vipro"
      style={{ scale, rotate, z: 0 }}
      className='sticky top-0 min-h-screen py-12 lg:py-0 bg-background-main text-text-primary flex flex-col items-center justify-center border-t border-border-light shadow-[0_-20px_50px_rgba(0,0,0,0.03)] antialiased [transform-style:preserve-3d] [backface-visibility:hidden]'
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-16 relative z-10">
        <div className="w-full lg:w-1/2">
          <div className="rounded-xl relative w-full aspect-[4/5] md:aspect-square rounded-sm overflow-hidden shadow-sm border border-border-light bg-white">
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
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
            Descubre tu nivel<br />de preparación
          </h2>
          <p className="text-lg text-text-secondary mb-10 leading-relaxed max-w-lg font-medium">
            Completa nuestro Formulario VIPRO para evaluar tu perfil en minutos. Al finalizar, recibirás un diagnóstico preliminar y un 25% de descuento para tu asesoría personalizada.
          </p>
          <button onClick={() => window.location.href = '/vipro-form'} className="bg-brand-primary text-white font-semibold px-8 py-3 rounded-sm hover:bg-[#0f3755] transition-colors text-sm">
            Iniciar evaluación VIPRO
          </button>
        </div>
      </div>
    </motion.section>
  );
};

const Section3 = ({ scrollYProgress }) => {
  const scale = useTransform(scrollYProgress, [0.5, 1], [0.8, 1]);
  const rotate = useTransform(scrollYProgress, [0.5, 1], [5, 0]);

  return (
    <motion.section
      id="cita-virtual"
      style={{ scale, rotate, z: 0 }}
      className='relative min-h-screen py-12 lg:py-0 bg-background-main text-text-primary flex flex-col items-center justify-center border-t border-border-light shadow-[0_-20px_50px_rgba(0,0,0,0.05)] antialiased [transform-style:preserve-3d] [backface-visibility:hidden]'
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 relative z-10">
        <div className="w-full lg:w-1/2">
          <div className="rounded-xl relative w-full aspect-[4/5] md:aspect-square rounded-sm overflow-hidden shadow-sm border border-border-light bg-white">
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
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
            Agenda tu asesoría<br />online
          </h2>
          <p className="text-lg text-text-secondary mb-10 leading-relaxed max-w-lg font-medium">
            Resuelve tus dudas desde la comodidad de tu hogar. Conéctate con un especialista certificado a través de una videollamada segura (Google Meet o Zoom) para revisar tu perfil y definir tu estrategia sin necesidad de trasladarte.
          </p>
          <button onClick={() => window.location.href = '/citas'} className="bg-brand-primary text-white font-semibold px-8 py-3 rounded-sm hover:bg-[#0f3755] transition-colors text-sm">
            Agendar asesoría virtual
          </button>
        </div>
      </div>
    </motion.section>
  );
};
