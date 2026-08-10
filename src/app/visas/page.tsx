"use client";

import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { visaDestinations } from "../constants/visas/destinations";

const countries = visaDestinations.map(d => ({
    code: d.code.toUpperCase(),
    name: d.name,
    flag: d.flagImage,
    type: d.type,
    description: d.description,
    available: d.enabled,
    badge: d.badge
}));

export default function VisasPage() {
    const headerRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (headerRef.current) {}
    }, []);

    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen w-full flex flex-col bg-background-main">
            <Header headerRef={headerRef} />

            {/* Header Hero Banner */}
            <div className="w-full bg-brand-primary py-16 px-6 relative overflow-hidden text-left">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="w-[80%] mx-auto relative z-10 space-y-4">
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-white/80 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                        Catálogo Consular Global
                    </span>
                    <h1 className="text-4xl md:text-5xl text-white leading-tight font-semibold font-serif italic">
                        Guías Oficiales y Asesoría de Visas por País
                    </h1>
                    <p className="text-white/90 text-base md:text-lg max-w-2xl leading-relaxed">
                        Explora los requisitos de visado, aranceles consulares, documentación de solvencia y procedimientos paso a paso validados por nuestros expertos.
                    </p>
                </div>
            </div>

            <main className="w-[80%] mx-auto py-14 flex-1 space-y-10">
                {/* Search Bar & Filters */}
                <div className="bg-white border border-border-light rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-96">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar por país o tipo de visa..."
                            className="w-full pl-9 pr-4 py-2.5 bg-background-main border border-border-light rounded-lg text-xs text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                        />
                    </div>
                    <span className="text-xs font-semibold text-text-secondary">
                        Mostrando {filteredCountries.length} de {countries.length} destinos consulares
                    </span>
                </div>

                {/* Country Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredCountries.map((country) => (
                        <div
                            key={country.code}
                            className="bg-white rounded-xl overflow-hidden border border-border-light shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1 text-left"
                        >
                            <div className="w-full h-52 relative overflow-hidden bg-gray-100 flex-shrink-0">
                                <img
                                    src={country.flag}
                                    alt={`Bandera de ${country.name}`}
                                    className="w-full h-full object-cover object-center"
                                />
                                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-brand-primary shadow-sm border border-border-light">
                                    {country.badge}
                                </div>
                                {!country.available && (
                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                                        <span className="bg-white text-gray-900 text-xs font-extrabold tracking-widest uppercase px-4 py-2 rounded-full shadow-lg">
                                            Próximamente
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Card Content */}
                            <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                                        {country.type}
                                    </span>
                                    <h2 className="text-xl font-bold font-serif text-text-primary">
                                        Guía de Visa para {country.name}
                                    </h2>
                                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                                        {country.description}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-border-light flex items-center justify-between">
                                    {country.available ? (
                                        <Link
                                            href={`/visas/${country.code.toLowerCase()}`}
                                            className="w-full text-center px-4 py-2.5 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-sm transition-colors cursor-pointer"
                                        >
                                            Ver Guía Completa de Visa &rarr;
                                        </Link>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full py-2.5 bg-gray-100 text-gray-400 text-xs font-bold rounded-sm cursor-not-allowed text-center"
                                        >
                                            No disponible aún
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