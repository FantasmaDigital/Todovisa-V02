"use client"

import { Header } from "../../components/shared/Header";
import { Footer } from "../../components/shared/Footer";
import { useEffect, useRef, useState } from "react";
import { countryVisaData } from "../../constants/visas/data";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useParams } from "next/navigation";

export default function VisaDetailPage() {
    const params = useParams();
    const countryCode = (params?.country as string)?.toUpperCase();
    const [openRegion, setOpenRegion] = useState<string | null>(null);
    const headerRef = useRef(null);

    useEffect(() => {
        if (!countryCode) notFound();
    }, [countryCode]);

    const country = countryVisaData[countryCode];

    if (!country) return null;

    return (
        <div className="min-h-screen w-full flex flex-col bg-[#F9F9F8]">
            <Header headerRef={headerRef} />

            {/* Hero Banner */}
            <div className="w-full bg-brand-primary px-6 py-16 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="w-[80%] mx-auto flex flex-col md:flex-row gap-10 items-center relative z-10">
                    {/* Flag */}
                    <div className="w-40 h-28 rounded-xl overflow-hidden shadow-xl flex-shrink-0 border border-white/20">
                        {country.flag ? (
                            <img src={country.flag} alt={country.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl bg-white/10">
                                {country.flagEmoji}
                            </div>
                        )}
                    </div>
                    {/* Text */}
                    <div>
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-2">Guía de Visa</p>
                        <h1 className="text-4xl md:text-5xl font-semibold font-serif italic text-white leading-tight mb-3">
                            {country.name}
                        </h1>
                        <p className="text-white/95 text-base max-w-2xl leading-relaxed">
                            {country.heroDescription}
                        </p>
                        <Link
                            href={`/vipro-form?country=${country.code}`}
                            className="inline-block mt-6 bg-white text-brand-primary text-sm font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors shadow-md"
                        >
                            Iniciar Evaluación VIPRO →
                        </Link>
                    </div>
                </div>
            </div>

            <main className="w-[80%] mx-auto py-16 flex flex-col gap-16">

                {/* Requirements */}
                <section>
                    <h2 className="text-2xl md:text-3xl font-serif text-text-primary mb-8 border-b border-border-light pb-4">
                        Requisitos Generales
                    </h2>
                    <div className="flex flex-col gap-4">
                        {country.requirements.map((req) => (
                            <div key={req.id} className="flex gap-5 bg-white rounded-xl border border-border-light p-6 shadow-sm">
                                <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {req.id}
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-primary mb-1">{req.title}</h3>
                                    <p className="text-text-secondary text-sm leading-relaxed">{req.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Procedure */}
                <section>
                    <h2 className="text-2xl md:text-3xl font-serif text-text-primary mb-8 border-b border-border-light pb-4">
                        Procedimiento de Solicitud
                    </h2>
                    <div className="relative flex flex-col gap-0">
                        {country.procedure.map((step, i) => (
                            <div key={i} className="flex gap-6 relative">
                                {/* Timeline line */}
                                {i < country.procedure.length - 1 && (
                                    <div className="absolute left-[17px] top-10 w-0.5 h-full bg-border-light z-0"></div>
                                )}
                                <div className="w-9 h-9 rounded-full border-2 border-brand-primary bg-white flex items-center justify-center text-brand-primary font-bold text-sm flex-shrink-0 z-10 mt-0.5">
                                    {i + 1}
                                </div>
                                <div className="pb-10">
                                    <h3 className="font-bold text-text-primary mb-1">{step.title}</h3>
                                    <p className="text-text-secondary text-sm leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Countries requiring visa — collapsible by region */}
                {country.requiringCountries.length > 0 && (
                    <section>
                        <h2 className="text-2xl md:text-3xl font-serif text-text-primary mb-2 border-b border-border-light pb-4">
                            Países que requieren visa
                        </h2>
                        <p className="text-text-secondary text-sm mb-8">
                            A continuación se presenta un listado de los países cuyos ciudadanos requieren visa para ingresar a {country.name}.
                        </p>
                        <div className="flex flex-col gap-3">
                            {country.requiringCountries.map((region) => (
                                <div key={region.region} className="bg-white rounded-xl border border-border-light overflow-hidden shadow-sm">
                                    <button
                                        onClick={() => setOpenRegion(openRegion === region.region ? null : region.region)}
                                        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-text-primary">{region.region}</span>
                                            <span className="text-xs font-semibold text-text-secondary bg-gray-100 px-2.5 py-1 rounded-full">
                                                {region.countries.length} países
                                            </span>
                                        </div>
                                        <svg
                                            className={`w-5 h-5 text-text-secondary transition-transform duration-300 ${openRegion === region.region ? "rotate-180" : ""}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {openRegion === region.region && (
                                        <div className="px-6 pb-6 border-t border-border-light">
                                            <div className="flex flex-wrap gap-2 pt-4">
                                                {region.countries.map((c) => (
                                                    <span key={c} className="text-xs font-medium text-text-primary bg-brand-light border border-brand-primary/10 px-3 py-1.5 rounded-full">
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Additional Info */}
                {country.additionalInfo.length > 0 && (
                    <section>
                        <h2 className="text-2xl md:text-3xl font-serif text-text-primary mb-8 border-b border-border-light pb-4">
                            Información Adicional
                        </h2>
                        <ul className="flex flex-col gap-3">
                            {country.additionalInfo.map((info, i) => (
                                <li key={i} className="flex gap-3 text-text-secondary text-sm leading-relaxed">
                                    <span className="text-brand-primary font-bold mt-0.5">→</span>
                                    <span>{info}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Sources */}
                {country.sources.length > 0 && (
                    <section className="border-t border-border-light pt-8">
                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-4">Fuentes</h3>
                        <ul className="flex flex-col gap-2">
                            {country.sources.map((src, i) => (
                                <li key={i}>
                                    <a
                                        href={src.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-brand-primary hover:underline font-medium"
                                    >
                                        {src.label} ↗
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* CTA */}
                <div className="bg-brand-primary rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-semibold font-serif italic text-white mb-2">¿Listo para comenzar?</h3>
                        <p className="text-white/90 text-sm">Realiza tu Evaluación VIPRO y obtén un diagnóstico de tu perfil migratorio.</p>
                    </div>
                    <Link
                        href={`/vipro-form?country=${country.code}`}
                        className="relative z-10 flex-shrink-0 bg-white text-brand-primary text-sm font-bold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors shadow-lg whitespace-nowrap"
                    >
                        Iniciar Evaluación VIPRO →
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
