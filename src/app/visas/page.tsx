"use client"

import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import { useEffect, useRef } from "react";
import Link from "next/link";

const countries = [
    {
        code: "US",
        name: "Estados Unidos",
        flag: "/images/flag_us.png",
        flagEmoji: null,
        description: "País de América del Norte conocido por su diversidad cultural, economía poderosa y liderazgo global en política y tecnología.",
        available: true,
    },
    {
        code: "CA",
        name: "Canadá",
        flag: "/images/flag_ca.png",
        flagEmoji: null,
        description: "País en América del Norte famoso por sus paisajes naturales vastos, multiculturalismo y alta calidad de vida.",
        available: true,
    },
    {
        code: "MX",
        name: "México",
        flag: "/images/flag_mx.png",
        flagEmoji: null,
        description: "País en América del Norte rico en cultura, historia, playas paradisíacas y vida urbana vibrante.",
        available: true,
    },
    {
        code: "UK",
        name: "Inglaterra",
        flag: "/images/flag_uk.png",
        flagEmoji: null,
        description: "Parte del Reino Unido famosa por su historia rica, contribuciones a la literatura y ciencia, y su monarquía.",
        available: true,
    },
    {
        code: "CN",
        name: "China",
        flag: "/images/flag_ch.png",
        flagEmoji: null,
        description: "País en Asia conocido por su antigua civilización, avances tecnológicos y maravillas como la Gran Muralla y la Ciudad Prohibida.",
        available: false,
    },
    {
        code: "AU",
        name: "Australia",
        flag: "/images/flag_aus.png",
        flagEmoji: null,
        description: "País en Oceanía famoso por su fauna única, paisajes naturales impresionantes y un estilo de vida relajado.",
        available: true,
    },
    {
        code: "IN",
        name: "India",
        flag: "/images/flag_in.png",
        flagEmoji: null,
        description: "País en Asia del Sur conocido por su diversidad cultural, riqueza histórica y espiritualidad, hogar de monumentos como el Taj Mahal.",
        available: true,
    },
];

const GuideIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
);

export default function VisasPage() {
    const headerRef = useRef(null);

    useEffect(() => {
        if (headerRef.current) { }
    }, []);

    return (
        <div className="min-h-screen w-full flex flex-col bg-background-main">
            <Header headerRef={headerRef} />

            <div className="w-full bg-brand-primary py-14 px-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="w-[80%] mx-auto relative z-10">
                    <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/70 mb-3">Asesoría de Visas</p>
                    <h1 className="text-4xl md:text-5xl text-white leading-tight mb-4 font-semibold font-serif italic">
                        Asesoría de visas para todo el mundo
                    </h1>
                    <p className="text-white/95 text-base md:text-lg max-w-2xl leading-relaxed">
                        En TodoVisa te ofrecemos asesoría integral para la obtención de visas. Nos encargamos del llenado de formularios,
                        pago de derechos, perfilamiento, programación de citas y seguimiento de tu proceso.
                    </p>
                </div>
            </div>

            <main className="w-[80%] mx-auto py-14 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {countries.map((country) => (
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
                                <div className="flex items-center gap-2 mb-4 text-md font-bold text-gray-800">
                                    <GuideIcon />
                                    <span>Destino</span>
                                </div>

                                {/* Title */}
                                <h2 className="text-[22px] font-bold text-gray-900 mb-6 leading-[1.3] tracking-tight">
                                    Guía de trámite de Visa para {country.name}
                                </h2>

                                {/* Spacer to push button to the bottom */}
                                <div className="flex-1"></div>

                                {/* Action Button */}
                                <div className="mt-4">
                                    {country.available ? (
                                        <Link
                                            href={`/visas/${country.code.toLowerCase()}`}
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