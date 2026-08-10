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
    const rawCode = (params?.country as string) || "";
    const countryKey = rawCode.toLowerCase();
    const [openRegion, setOpenRegion] = useState<string | null>(null);
    const [activeDocTab, setActiveDocTab] = useState<"photos" | "bank" | "ties" | "job">("photos");
    const headerRef = useRef(null);

    const country = countryVisaData[countryKey] || countryVisaData[rawCode.toUpperCase()];

    useEffect(() => {
        if (!rawCode) notFound();
    }, [rawCode]);

    if (!country) return null;


    return (
        <div className="min-h-screen w-full flex flex-col bg-[#F9F9F8]">
            <Header headerRef={headerRef} />

            {/* Hero Banner */}
            <div className="w-full bg-brand-primary px-4 sm:px-6 py-16 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-10 items-center relative z-10">
                    {/* Text */}
                    <div className="text-left">
                        <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-2">Guía de Visa</p>
                        <h1 className="text-4xl md:text-5xl font-semibold font-serif italic text-white leading-tight mb-3">
                            {country.name}
                        </h1>
                        <p className="text-white/95 text-base max-w-2xl leading-relaxed">
                            {country.heroDescription}
                        </p>
                    </div>
                </div>
            </div>

            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 flex flex-col gap-16">

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

                {/* ── Guía de Preparación de Documentación Crítica ── */}
                <section className="bg-white border border-border-light rounded-2xl p-8 shadow-sm">
                    <div className="mb-8 border-b border-border-light pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="text-left">
                            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Sección Especializada</span>
                            <h2 className="text-2xl md:text-3xl font-serif text-text-primary mt-1 italic">
                                Guía de Preparación de Documentación Crítica
                            </h2>
                            <p className="text-xs text-text-secondary mt-1">
                                El 85% de los rechazos consulares ocurren por errores en estos 4 documentos. Asegúrate de cumplir las especificaciones exactas.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                        {/* Selector Tabs (Left side) */}
                        <div className="lg:col-span-1 flex flex-row lg:flex-col gap-2.5 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0">
                            {[
                                { id: "photos", label: "📸 Fotos Consulares", desc: "Formato y encuadre" },
                                { id: "bank", label: "🏦 Estados de Cuenta", desc: "Solvencia y liquidez" },
                                { id: "ties", label: "🏡 Demostración de Arraigo", desc: "Vínculos con tu país" },
                                { id: "job", label: "📄 Constancias Laborales", desc: "Puesto, sueldo y antigüedad" }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveDocTab(tab.id as any)}
                                    className={`w-full text-left p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 whitespace-nowrap lg:whitespace-normal ${
                                        activeDocTab === tab.id
                                            ? "border-brand-primary bg-brand-light/30 shadow-sm ring-1 ring-brand-primary font-bold"
                                            : "border-border-light bg-white hover:bg-background-hover/30"
                                    }`}
                                >
                                    <span className="text-xs font-bold text-text-primary">{tab.label}</span>
                                    <span className="text-[10px] text-text-muted hidden md:block">{tab.desc}</span>
                                </button>
                            ))}
                        </div>

                        {/* Content Detail Panel (Right side) */}
                        <div className="lg:col-span-3 bg-background-main border border-border-light rounded-xl p-6 md:p-8 min-h-[300px] flex flex-col justify-between">
                            {activeDocTab === "photos" && (
                                <div className="space-y-5 text-left animate-in fade-in duration-300">
                                    <h4 className="text-lg font-bold text-text-primary">📸 Especificaciones de Fotos Consulares</h4>
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                        Las embajadas utilizan escaneo biométrico automatizado. Cualquier sombra, brillo o accesorio incorrecto resultará en el rechazo inmediato del formulario.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                        <div className="bg-white border border-emerald-200 p-4 rounded-xl space-y-2">
                                            <p className="font-bold text-emerald-700">✓ Qué hacer:</p>
                                            <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
                                                <li>Medida exacta de 5x5 cm (2x2 pulgadas).</li>
                                                <li>Fondo blanco liso y mate (sin sombras).</li>
                                                <li>Expresión facial neutra, ojos abiertos mirando al frente.</li>
                                                <li>Tomada dentro de los últimos 6 meses.</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white border border-red-200 p-4 rounded-xl space-y-2">
                                            <p className="font-bold text-red-700">✗ Evitar por completo:</p>
                                            <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
                                                <li>Usar lentes/anteojos (prohibidos por completo).</li>
                                                <li>Prendas de color blanco (se mezclan con el fondo).</li>
                                                <li>Cabello cubriendo las cejas u orejas.</li>
                                                <li>Filtros digitales, retoques de piel o sombras faciales.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeDocTab === "bank" && (
                                <div className="space-y-5 text-left animate-in fade-in duration-300">
                                    <h4 className="text-lg font-bold text-text-primary">🏦 Estados de Cuenta Financieros</h4>
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                        El cónsul busca comprobar que puedes financiar tu viaje por ti mismo y que regresarás. La consistencia es más importante que un saldo alto repentino.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                        <div className="bg-white border border-emerald-200 p-4 rounded-xl space-y-2">
                                            <p className="font-bold text-emerald-700">✓ Qué presentar:</p>
                                            <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
                                                <li>Estados de cuenta de los últimos 3 a 6 meses completos.</li>
                                                <li>Cuentas con saldo promedio estable y depósitos recurrentes.</li>
                                                <li>Documentos oficiales con sello húmedo del banco.</li>
                                                <li>Tarjetas de crédito que demuestren solvencia adicional.</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white border border-red-200 p-4 rounded-xl space-y-2">
                                            <p className="font-bold text-red-700">✗ Señales de Alerta (Rechazo):</p>
                                            <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
                                                <li>Depósitos masivos atípicos justo antes del trámite.</li>
                                                <li>Capturas de pantalla o impresiones de banca en línea sin certificar.</li>
                                                <li>Cuentas empresariales sin acta constitutiva que te relacione.</li>
                                                <li>Saldos netos menores al costo estimado del viaje.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeDocTab === "ties" && (
                                <div className="space-y-5 text-left animate-in fade-in duration-300">
                                    <h4 className="text-lg font-bold text-text-primary">🏡 Demostración de Arraigo (Lazos Fuertes)</h4>
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                        La ley consular presume que todo solicitante es un inmigrante potencial. Tu deber es demostrar lazos irrompibles que te obliguen a regresar a tu país de origen.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                        <div className="bg-white border border-emerald-200 p-4 rounded-xl space-y-2">
                                            <p className="font-bold text-emerald-700">✓ Lazos de Arraigo Válidos:</p>
                                            <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
                                                <li>Títulos de propiedad de bienes inmuebles (casas, terrenos).</li>
                                                <li>Matrícula de vehículos a tu nombre.</li>
                                                <li>Certificados de matrimonio y actas de nacimiento de hijos.</li>
                                                <li>Inscripción universitaria activa y pensión pagada.</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white border border-red-200 p-4 rounded-xl space-y-2">
                                            <p className="font-bold text-red-700">✗ Qué NO cuenta como arraigo:</p>
                                            <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
                                                <li>Cartas de invitación informales en el extranjero.</li>
                                                <li>Bienes familiares no transferidos legalmente a tu nombre.</li>
                                                <li>Promesas verbales de retorno sin respaldo físico.</li>
                                                <li>Contratos de arrendamiento a corto plazo.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeDocTab === "job" && (
                                <div className="space-y-5 text-left animate-in fade-in duration-300">
                                    <h4 className="text-lg font-bold text-text-primary">📄 Constancias Laborales y Salariales</h4>
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                        Tu constancia laboral certifica que tienes ingresos estables y legítimos, y que cuentas con autorización para ausentarte temporalmente por vacaciones.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                        <div className="bg-white border border-emerald-200 p-4 rounded-xl space-y-2">
                                            <p className="font-bold text-emerald-700">✓ Elementos Obligatorios:</p>
                                            <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
                                                <li>Emitida en hoja membretada original de la empresa.</li>
                                                <li>Firma física, cargo y contacto directo de Recursos Humanos.</li>
                                                <li>Detalle exacto de puesto, sueldo mensual y fecha de ingreso.</li>
                                                <li>Mención explícita del período de vacaciones aprobado.</li>
                                            </ul>
                                        </div>
                                        <div className="bg-white border border-red-200 p-4 rounded-xl space-y-2">
                                            <p className="font-bold text-red-700">✗ Errores comunes:</p>
                                            <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
                                                <li>Constancia sin firma húmeda ni sello de la compañía.</li>
                                                <li>Omitir el salario mensual o el tiempo de antigüedad.</li>
                                                <li>Fechas de emisión muy antiguas (deben ser menores a 30 días).</li>
                                                <li>Falta de número telefónico fijo para validación consular.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 pt-4 border-t border-border-light text-center flex flex-col sm:flex-row justify-between items-center gap-3">
                                <span className="text-[10px] text-text-secondary font-bold uppercase">¿Deseas que revisemos tus documentos?</span>
                                <Link
                                    href="/citas"
                                    className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-hover transition-colors shadow-sm"
                                >
                                    Agendar Revisión Virtual →
                                </Link>
                            </div>
                        </div>
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
