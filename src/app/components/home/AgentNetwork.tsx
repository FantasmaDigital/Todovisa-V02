"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export const AgentNetwork = () => {
    const [price, setPrice] = useState(Number(process.env.NEXT_PUBLIC_FULL_SERVICE_PRICE) || 150);

    useEffect(() => {
        const savedPrice = localStorage.getItem("fullServicePrice");
        if (savedPrice) {
            setPrice(Number(savedPrice));
        }

        const handleStorage = () => {
            const saved = localStorage.getItem("fullServicePrice");
            if (saved) {
                setPrice(Number(saved));
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const commissionAmount = price * 0.60;

    return (
        <section id="unirte-red" className="w-full mx-auto flex flex-col">

            {/* Incentivación superior: stats bar */}
            <div className="w-full bg-brand-primary px-8 py-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"></div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative">
                    <div className="max-w-sm">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Red de Expertos TodoVisa</span>
                        <p className="text-white font-bold text-xl mt-1 leading-snug font-serif italic">
                            Gana hasta ${commissionAmount.toFixed(2)} USD por trámite. Sin buscar clientes.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-6 text-center text-xs">
                        <div>
                            <span className="block text-3xl font-bold text-white">60%</span>
                            <span className="text-white/60 leading-tight">Comisión base</span>
                        </div>
                        <div>
                            <span className="block text-sm font-bold text-white mt-2">Semanal</span>
                            <span className="text-white/60 leading-tight">Pago cada viernes</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cuerpo principal: texto + imagen */}
            <div className="flex flex-col lg:flex-row items-center gap-16">
                {/* Columna izquierda: texto — 80% centrado dentro de su mitad */}
                <div className="w-full lg:w-1/2 flex items-center justify-center">
                    <div className="w-[70%] flex flex-col items-start text-left">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary mb-4">ÚNETE A LA RED</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">
                            Tu experiencia consular<br />merece ser rentable.
                        </h2>
                        <p className="text-lg text-text-secondary mb-6 leading-relaxed max-w-lg font-medium">
                            TodoVisa conecta a asesores certificados con clientes que ya han sido evaluados y están listos para comenzar su trámite. Tú solo haces lo que mejor sabes hacer: conseguir visas aprobadas.
                        </p>
                        <p className="text-sm text-text-secondary mb-10 leading-relaxed max-w-lg border-l-2 border-brand-primary/30 pl-4 italic">
                            &ldquo;Dejé de perder tiempo buscando prospectos. Ahora gestiono 8–12 expedientes activos por semana desde mi laptop.&rdquo;<br />
                            <span className="not-italic font-semibold text-text-primary mt-1 block">— Agente verificado TodoVisa, CDMX</span>
                        </p>
                        <ul className="flex flex-col gap-3 mb-10">
                            {[
                                "Clientes pre-calificados y comprometidos asignados automáticamente",
                                "Panel digital para expedientes, chat y documentos",
                                "Comisiones del 60% por expediente gestionado",
                                "Soporte técnico y legal incluido en la plataforma",
                            ].map((item) => (
                                <li key={item} className="flex items-start gap-3 text-sm text-text-secondary">
                                    <span className="mt-0.5 text-brand-primary font-bold text-base leading-none">✓</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <Link href="/agents/apply" className="bg-brand-primary text-white font-semibold px-8 py-3 rounded-sm hover:bg-brand-hover transition-colors text-sm border-none focus:outline-none inline-block text-center">
                            Aplicar como experto →
                        </Link>
                    </div>
                </div>

                {/* Columna derecha: imagen */}
                <div className="w-full lg:w-1/2">
                    <div className="relative w-full aspect-[4/5] md:aspect-square overflow-hidden shadow-sm bg-white">
                        <img
                            src="/images/network-agents.webp"
                            alt="Red de Agentes TODOVISA"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}