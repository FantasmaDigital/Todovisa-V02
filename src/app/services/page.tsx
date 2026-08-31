"use client"

import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "../store/authStore";
import { getCentralizedDestinations } from "../constants/visas/destinations";
import { getSystemConfig } from "../constants/config";

// Derived dynamically from central visa destinations
const getServiceCountries = () => getCentralizedDestinations().map(d => ({
    code: d.code.toUpperCase(),
    name: d.name,
    flag: d.flagImage,
    flagEmoji: d.flag,
    description: d.description,
    available: d.enabled
}));

const GuideIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
);

export default function ServicesPage() {
    const headerRef = useRef(null);
    const user = useAuthStore((state) => state.user);
    const isViproCompleted = user 
        ? Boolean(user.viproCompleted || user.viproScore || user.hasCompletedVipro) 
        : Boolean(typeof window !== "undefined" && (localStorage.getItem("vipro_completed") === "true" || Boolean(localStorage.getItem("vipro_score"))));
    const [price, setPrice] = useState(() => getSystemConfig().fullServicePrice);
    const [viproPrice, setViproPrice] = useState(() => getSystemConfig().viproPrice);

    useEffect(() => {
        const config = getSystemConfig();
        setPrice(config.fullServicePrice);
        setViproPrice(config.viproPrice);

        const handleStorage = () => {
            const updated = getSystemConfig();
            setPrice(updated.fullServicePrice);
            setViproPrice(updated.viproPrice);
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const discountPrice = price * 0.75;

    return (
        <div className="min-h-screen w-full flex flex-col bg-background-main">
            <Header headerRef={headerRef} />

            <div className="w-full bg-brand-primary py-14 px-4 sm:px-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-3">Nuestros servicios</p>
                    <h1 className="text-4xl md:text-5xl text-white leading-tight mb-4 font-semibold font-serif italic">
                        Asesoría de visas para todo el mundo
                    </h1>
                    <p className="text-white/95 text-base md:text-lg max-w-2xl leading-relaxed">
                        En TodoVisa te ofrecemos asesoría integral para la obtención de visas. Nos encargamos del llenado de formularios,
                        pago de derechos, perfilamiento, programación de citas y seguimiento de tu proceso.
                    </p>
                </div>
            </div>

            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14 flex-1 space-y-16">
                <section className="bg-white border border-border-light rounded-2xl p-8 md:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.03)] text-left">
                    <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                        <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-brand-primary bg-brand-light px-3 py-1 rounded-full">
                            Transparencia y Claridad de Servicios
                        </span>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-text-primary">
                            Conoce la diferencia entre nuestros dos modelos
                        </h2>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            En TodoVisa nos basamos en estándares consulares internacionales. Elige el nivel de acompañamiento exacto que tu perfil requiere.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                        <div className="bg-gradient-to-b from-blue-50/40 via-white to-white border border-blue-200/80 rounded-xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-bl-lg">
                                Diagnóstico Algorítmico Express
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-serif font-bold text-text-primary flex items-center gap-2">
                                        📊 Evaluación VIPRO
                                    </h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-extrabold text-brand-primary font-mono">${viproPrice.toFixed(2)}</span>
                                        <span className="text-xs text-text-muted font-sans">USD / pago único</span>
                                    </div>
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                        Herramienta de inteligencia consular para diagnosticar la viabilidad de tu perfil antes de iniciar procesos oficiales.
                                    </p>
                                </div>

                                <div className="space-y-3 border-t border-blue-100 pt-4">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-900">Lo que Incluye:</p>
                                    <ul className="space-y-2.5 text-xs text-text-secondary">
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span>
                                            <span><strong>Scoring Consular de Viabilidad (0-100 pts)</strong> según tus ingresos, empleo e historial de viajes.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span>
                                            <span><strong>Detección de Riesgos 214(b)</strong> para evitar rechazos por falta de arraigo en tu país.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span>
                                            <span><strong>Checklist de Documentación Sugerida</strong> adaptado a tu situación económica.</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-3 text-[11px] text-amber-900 leading-relaxed">
                                    <strong>Nota importante:</strong> VIPRO es un diagnóstico automatizado. <em>No incluye asesor humano ni llenado de formularios DS-160/UKVI.</em>
                                </div>
                            </div>

                            <div className="pt-6">
                                {isViproCompleted ? (
                                    <Link
                                        href="/profile?tab=vipro"
                                        className="w-full inline-block text-center px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-all shadow-xs"
                                    >
                                        Ver Diagnóstico VIPRO Completado &rarr;
                                    </Link>
                                ) : (
                                    <Link
                                        href="/vipro-form"
                                        className="w-full inline-block text-center px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-all shadow-xs"
                                    >
                                        Comenzar Evaluación VIPRO (${viproPrice.toFixed(2)} USD) &rarr;
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="bg-gradient-to-b from-emerald-50/40 via-white to-white border border-emerald-200/80 rounded-xl p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-emerald-700 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-bl-lg">
                                Concierge 1-a-1 Integral
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-serif font-bold text-text-primary flex items-center gap-2">
                                        👤 Asesoría Completa con Experto
                                    </h3>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-extrabold text-emerald-700 font-mono">${discountPrice.toFixed(2)}</span>
                                        <span className="text-xs text-text-muted font-sans">USD / paquete completo</span>
                                    </div>
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                        Representación por un asesor certificado que asume la elaboración técnica y personalizada de tu expediente de inicio a fin.
                                    </p>
                                </div>

                                <div className="space-y-3 border-t border-emerald-100 pt-4">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">Lo que Incluye:</p>
                                    <ul className="space-y-2.5 text-xs text-text-secondary">
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span>
                                            <span><strong>Asesor Consular Asignado</strong> con comunicación ilimitada vía Chat con tu asesor experto.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span>
                                            <span><strong>Preformulario y Llenado Oficial DS-160 / UKVI</strong> sin margen de error humano.</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span>
                                            <span><strong>Auditoría Digital de Expediente</strong> (pasaporte, DUI, constancias y solvencia).</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span>
                                            <span><strong>Agendamiento Prioritario de Citas</strong> (CAS / Embajada).</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span>
                                            <span><strong>Simulacro Intensivo de Entrevista por Zoom</strong> con preguntas reales de cónsules.</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-lg p-3 text-[11px] text-emerald-950 leading-relaxed">
                                    <strong>Garantía de Acompañamiento:</strong> Tu asesor te guiará hasta la devolución de tu pasaporte en el courier.
                                </div>
                            </div>

                            <div className="pt-6">
                                <Link
                                    href="/agents"
                                    className="w-full inline-block text-center px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-sm transition-all shadow-xs"
                                >
                                    Elegir mi Asesor Consular (${discountPrice.toFixed(2)} USD) &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="text-left space-y-4">
                    <h2 className="text-2xl font-serif font-bold text-text-primary">Explora Procesos de Visa por País</h2>
                    <p className="text-xs text-text-secondary">Selecciona el país de tu interés para conocer la guía oficial de requisitos y tiempos de procesamiento.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {getServiceCountries().map((country) => (
                        <div
                            key={country.code}
                            className="bg-white rounded-lg overflow-hidden border border-gray-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:cursor-pointer hover:-translate-y-4"
                        >
                            <div className="w-full h-[320px] relative overflow-hidden bg-gray-100 flex-shrink-0">
                                {country.flag ? (
                                    <img
                                        src={country.flag}
                                        alt={`Bandera de ${country.name}`}
                                        className="w-full h-full object-cover object-center"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#EAE9FE] to-[#D6D5FC] flex items-center justify-center text-[6rem] select-none">
                                        {country.flagEmoji}
                                    </div>
                                )}
                                {!country.available && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <span className="bg-white text-gray-900 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full shadow-lg">
                                            Próximamente
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Card Body */}
                            <div className="p-7 flex flex-col flex-1 items-start text-left">
                                {/* Tag */}
                                <div className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-800">
                                    <GuideIcon />
                                    <span>Destino</span>
                                </div>

                                <h2 className="text-[22px] font-bold text-gray-900 mb-6 leading-[1.3] tracking-tight">
                                    Guía de proceso de Visa para {country.name}
                                </h2>

                                {/* Spacer to push button to the bottom */}
                                <div className="flex-1"></div>

                                {/* Action Button */}
                                <div className="mt-4">
                                    {country.available ? (
                                        <Link
                                            href={`/vipro-form?country=${country.code}`}
                                            className="inline-block px-5 py-2.5 rounded-full border border-gray-300 text-[13px] font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                                        >
                                            Read more
                                        </Link>
                                    ) : (
                                        <button
                                            disabled
                                            className="inline-block px-5 py-2.5 rounded-full border border-gray-200 text-[13px] font-semibold text-gray-400 bg-gray-50 cursor-not-allowed"
                                        >
                                            No disponible
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}