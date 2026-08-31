"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";

export const Hero = ({ headerHeight }: { headerHeight: number | null }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="relative w-[98%] m-auto rounded-xl bg-[#0B1520] overflow-hidden shadow-2xl"
      style={{ height: `calc(98dvh - ${headerHeight || 80}px)`, minHeight: "620px" }}
    >
      {/* Dynamic ambient floating lights */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 20, 0],
          y: [0, -15, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/30 rounded-full blur-3xl pointer-events-none z-0"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -25, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none z-0"
      />

      {/* Background — clipped to rounded corners */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none select-none z-0">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: mounted ? 1 : 1.1, opacity: mounted ? 0.75 : 0 }}
          transition={{ duration: 2, ease: "easeOut" }}
          src="/images/backgrounds/visa_hero_bg.png"
          alt="Fondo de destino TodoVisa"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1520] via-[#0B1520]/60 to-[#0B1520]/30" />
      </div>

      {/* Content layer */}
      <section
        className="absolute inset-0 flex flex-col justify-center items-center text-center px-6 max-w-4xl mx-auto space-y-6 z-10"
      >
        {/* Rating Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-xs font-semibold text-white/90 shadow-lg cursor-default"
        >
          <span className="flex items-center gap-1 text-amber-300">
            {[...Array(5)].map((_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
              >
                ★
              </motion.span>
            ))}
          </span>
          <span className="font-medium">4.9/5 por +1,000 procesos evaluados</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.15] tracking-tight font-serif max-w-3xl"
        >
          Tu visa con seguridad, inteligencia consular y acompañamiento experto.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-base md:text-lg text-white/85 max-w-2xl font-light leading-relaxed"
        >
          Diagnostica tu viabilidad con VIPRO o conéctate con un asesor certificado para una solicitud sin errores.
        </motion.p>

        {/* Call-to-Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 pt-4 justify-center items-center w-full max-w-md"
        >
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="w-full sm:w-auto"
          >
            <Link
              href="/vipro-form"
              className="w-full sm:w-auto bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold px-8 py-3.5 rounded-md transition-all text-center shadow-lg hover:shadow-brand-primary/40 block border-none"
            >
              Iniciar Evaluación VIPRO →
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="w-full sm:w-auto"
          >
            <Link
              href="/agents"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold px-8 py-3.5 rounded-md transition-all text-center backdrop-blur-md block"
            >
              Conectar con Asesor Certificado
            </Link>
          </motion.div>
        </motion.div>

        {/* Subtle scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-60 text-white text-xs flex flex-col items-center gap-1 pointer-events-none"
        >
          <span className="text-[10px] uppercase tracking-widest font-semibold">Descubre más</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </section>
    </div>
  );
};