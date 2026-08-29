'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';

export function FeatureSplit({ refHeaderHeight }: { refHeaderHeight?: any }) {
  return (
    <section className="w-full bg-background-main py-16 md:py-24 space-y-20 font-sans overflow-hidden">
      {/* Section 1: Evaluación VIPRO */}
      <div id="evaluacion-vipro" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full lg:w-1/2"
          >
            <div className="rounded-xl relative w-full aspect-[4/5] md:aspect-square overflow-hidden border border-border-light bg-white shadow-md group">
              <img
                src="/images/viproform.webp"
                alt="Formulario VIPRO TODOVISA"
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="w-full lg:w-1/2 flex flex-col items-start text-left"
          >
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-primary mb-4 bg-brand-light/60 px-3 py-1 rounded-full border border-brand-primary/20">
              DIAGNÓSTICO PRELIMINAR
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
              Descubre tu nivel<br />de preparación
            </h2>
            <p className="text-base md:text-lg text-text-secondary mb-8 leading-relaxed max-w-lg font-medium">
              Completa nuestro Formulario VIPRO para evaluar tus lazos de arraigo y solvencia en minutos. Recibirás un diagnóstico preliminar y un 25% de descuento directo en tu asesoría personalizada.
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/vipro-form" className="bg-brand-primary text-white font-semibold px-8 py-3.5 rounded-md hover:bg-[#0f3755] transition-colors text-sm shadow-md inline-block border-none">
                Iniciar Evaluación VIPRO →
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Section 2: Red de Asesores Certificados */}
      <div id="asesoria-virtual" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 border-t border-border-light/60">
        <div className="flex flex-col lg:flex-row-reverse items-center gap-8 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full lg:w-1/2"
          >
            <div className="rounded-xl relative w-full aspect-[4/5] md:aspect-square overflow-hidden border border-border-light bg-white shadow-md group">
              <img
                src="/images/virtual-meet.webp"
                alt="Agentes Virtuales TODOVISA"
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="w-full lg:w-1/2 flex flex-col items-start text-left"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary mb-4 bg-brand-light/60 px-3 py-1 rounded-full border border-brand-primary/20">
              RED DE ASESORES CERTIFICADOS
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
              Acompañamiento experto<br />en todo tu proceso
            </h2>
            <p className="text-base md:text-lg text-text-secondary mb-8 leading-relaxed max-w-lg font-medium">
              Conéctate con un especialista certificado para la revisión de tu formulario consular, auditoría de expediente probatorio y simulacros de entrevista por videollamada 1 a 1 (Zoom o Meet).
            </p>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href="/agents" className="bg-brand-primary text-white font-semibold px-8 py-3.5 rounded-md hover:bg-[#0f3755] transition-colors text-sm shadow-md inline-block border-none">
                Conocer Red de Asesores →
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
