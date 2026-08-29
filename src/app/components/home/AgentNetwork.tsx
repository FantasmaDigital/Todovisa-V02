"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { getSystemConfig } from "@/app/constants/config";

export const AgentNetwork = () => {
    const [price, setPrice] = useState(() => getSystemConfig().fullServicePrice);
    const [commissionRate, setCommissionRate] = useState(() => getSystemConfig().agentCommissionRate);

    useEffect(() => {
        const config = getSystemConfig();
        setPrice(config.fullServicePrice);
        setCommissionRate(config.agentCommissionRate);

        const handleStorage = () => {
            const updated = getSystemConfig();
            setPrice(updated.fullServicePrice);
            setCommissionRate(updated.agentCommissionRate);
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const commissionAmount = price * (commissionRate / 100);

    return (
        <section id="unirte-red" className="w-full mx-auto flex flex-col overflow-hidden">
            {/* Incentivación superior: stats bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="w-full bg-brand-primary px-6 sm:px-10 py-8 relative overflow-hidden shadow-lg"
            >
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
                    <div className="max-w-md">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                            Red de Expertos TodoVisa
                        </span>
                        <p className="text-white font-bold text-xl md:text-2xl mt-2 leading-snug font-serif italic">
                            Gana por cada proceso. Sin buscar clientes.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-center text-xs">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center justify-center bg-white/10 p-3 rounded-lg border border-white/15 backdrop-blur-xs"
                        >
                            <span className="block text-3xl font-bold text-white font-mono">60%</span>
                            <span className="text-white/80 leading-tight">Comisión base</span>
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex flex-col items-center justify-center bg-white/10 p-3 rounded-lg border border-white/15 backdrop-blur-xs"
                        >
                            <span className="block text-base font-bold text-white mt-1">Semanal</span>
                            <span className="text-white/80 leading-tight">Pago cada viernes</span>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Cuerpo principal: texto + imagen */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                    {/* Columna izquierda: texto */}
                    <div className="w-full lg:w-1/2 flex items-center justify-center">
                        <div className="w-full max-w-xl flex flex-col items-start text-left">
                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary mb-3 bg-brand-light/60 px-3 py-1 rounded-full border border-brand-primary/20">
                                ÚNETE A LA RED
                            </span>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">
                                Tu experiencia consular<br className="hidden sm:inline" /> merece ser rentable.
                            </h2>
                            <p className="text-base md:text-lg text-text-secondary mb-6 leading-relaxed font-medium">
                                TodoVisa conecta a asesores certificados con clientes que ya han sido evaluados y están listos para comenzar su proceso. Tú solo haces lo que mejor sabes hacer: conseguir visas aprobadas.
                            </p>
                            <motion.p
                                initial={{ opacity: 0, x: -15 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="text-sm text-text-secondary mb-8 leading-relaxed border-l-2 border-brand-primary/40 pl-4 italic bg-brand-light/20 py-2 rounded-r-lg"
                            >
                                &ldquo;Dejé de perder tiempo buscando prospectos. Ahora gestiono 8–12 expedientes activos por semana desde mi laptop.&rdquo;<br />
                                <span className="not-italic font-semibold text-text-primary mt-1 block">— Agente verificado TodoVisa, CDMX</span>
                            </motion.p>
                            
                            <ul className="flex flex-col gap-3 mb-8 w-full">
                                {[
                                    "Clientes pre-calificados y comprometidos asignados automáticamente",
                                    "Panel digital para expedientes, chat y documentos",
                                    "Comisiones del 60% por expediente gestionado",
                                    "Soporte técnico y legal incluido en la plataforma",
                                ].map((item, idx) => (
                                    <motion.li
                                        key={item}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: idx * 0.1 }}
                                        className="flex items-start gap-3 text-sm text-text-secondary"
                                    >
                                        <span className="mt-0.5 text-brand-primary font-bold text-base leading-none bg-brand-light p-1 rounded-full">✓</span>
                                        <span className="pt-0.5 font-medium">{item}</span>
                                    </motion.li>
                                ))}
                            </ul>

                            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                                <Link href="/agents/apply" className="bg-brand-primary text-white font-semibold px-8 py-3.5 rounded-md hover:bg-brand-hover transition-colors text-sm border-none focus:outline-none inline-block text-center shadow-md">
                                    Aplicar como experto →
                                </Link>
                            </motion.div>
                        </div>
                    </div>

                    {/* Columna derecha: imagen */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="w-full lg:w-1/2"
                    >
                        <div className="relative w-full max-w-xl mx-auto lg:max-w-none aspect-[4/5] md:aspect-square overflow-hidden rounded-2xl border border-border-light shadow-xl bg-white group">
                            <img
                                src="/images/network-agents.webp"
                                alt="Red de Agentes TODOVISA"
                                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};