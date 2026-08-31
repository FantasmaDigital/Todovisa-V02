"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
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
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
          className="bg-[#0C1633] border border-blue-900/50 rounded-xl md:rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden transition-all duration-300 group-hover:border-amber-500/50 group-hover:shadow-amber-500/15"
        >
          {/* Animated Background subtle radial gradient */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-center relative z-10">
            {/* Left Column */}
            <div className="lg:col-span-8 text-left space-y-4">
              {/* Badge */}
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded border border-[#C6A035]/60 bg-[#1D1B13] text-[#E6C65A] text-xs font-extrabold uppercase tracking-wide shadow-sm"
              >
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  🏢
                </motion.span>
                <span>PROGRAMA ESPECIAL PARA AGENCIAS B2B</span>
              </motion.div>

              {/* Heading */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight group-hover:text-blue-100 transition-colors">
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
              <motion.div
                whileHover={{ scale: 1.05, y: -4 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-xs bg-[#19274D]/90 border border-blue-400/30 backdrop-blur-md rounded-xl p-6 md:p-7 text-center shadow-xl transition-all duration-300 group-hover:bg-[#1D2E5C] group-hover:border-amber-400/40"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-5xl md:text-6xl font-extrabold text-[#FFD700] font-mono tracking-tight mb-2 group-hover:scale-110 transition-transform duration-300"
                >
                  {agencyRate}%
                </motion.div>
                <div className="text-white text-xs md:text-sm font-bold uppercase tracking-wider mb-1">
                  COMISIÓN POR REFERIDO
                </div>
                <div className="text-blue-200/80 text-xs font-medium">
                  Enlace personalizado único →
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Link>
    </section>
  );
};
