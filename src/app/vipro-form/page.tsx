"use client"

import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ViproFormPage() {
    const headerRef = useRef(null);
    const [_, setHeaderHeight] = useState<number | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const router = useRouter();

    const handleSelectCountry = (country: string) => {
        setSelectedCountry(country);
    };

    useEffect(() => {
        if (headerRef.current) {
            const height = (headerRef.current as HTMLElement).offsetHeight;
            setHeaderHeight(height);
        }
    }, []);
    return (
        <div className="min-h-screen w-full flex flex-col relative bg-background-main">
            <Header headerRef={headerRef} />
            <main className="w-[80%] mx-auto py-12 md:py-20 flex flex-col gap-24 flex-1">
                <div className="flex flex-col md:flex-row items-center gap-20">
                    <div className="w-full md:w-1/2 flex flex-col items-start gap-6">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-text-primary leading-tight tracking-tight">
                            Evaluación <span className="text-brand-primary font-bold">VIPRO</span>
                        </h1>

                        <p className="text-base text-text-secondary leading-relaxed">
                            Selecciona una de las opciones disponibles para continuar con tu evaluación VIPRO. Te ofrecemos una asesoría experta y una amplia variedad de servicios adaptados a las exigencias de cada país. Tómate tu tiempo para revisar las opciones y da el siguiente paso hacia tus metas.
                        </p>

                        <div className="w-full flex flex-col gap-2 mt-2">
                            <label className="text-sm font-semibold text-text-primary">Destino de viaje:</label>
                            <select 
                                onChange={(e) => {
                                    const val = e.target.value;
                                    console.log(val);
                                    const emojiMap: Record<string, string> = {
                                        US: "🇺🇸", CA: "🇨🇦", MX: "🇲🇽", UK: "🇬🇧", CN: "🇨🇳", AU: "🇦🇺", IN: "🇮🇳"
                                    };
                                    handleSelectCountry(emojiMap[val] || "");
                                }}
                                className="w-full max-w-sm border border-border-light rounded-md px-4 py-3.5 text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all cursor-pointer shadow-sm"
                            >
                                <option value="">🌎 Selecciona un país...</option>
                                <option value="US">🇺🇸 Estados Unidos</option>
                                <option value="CA">🇨🇦 Canadá</option>
                                <option value="MX">🇲🇽 México</option>
                                <option value="UK">🇬🇧 Inglaterra</option>
                                <option value="CN">🇨🇳 China</option>
                                <option value="AU">🇦🇺 Australia</option>
                                <option value="IN">🇮🇳 India</option>
                            </select>
                        </div>

                        <div className="mt-2 flex flex-col gap-4">
                            <div className="flex items-end gap-3">
                                <span className="text-5xl font-bold text-text-primary">$19.99</span>
                                <span className="text-sm text-text-secondary mb-1">USD</span>
                            </div>
                            <span className="text-sm font-medium text-brand-primary bg-brand-light px-4 py-1.5 rounded-full w-max">
                                🎉 Recibirás un 25% de descuento en tu asesoría
                            </span>
                        </div>

                        <div className="flex flex-col gap-4 mt-4 w-full max-w-sm">
                            <button disabled={!selectedCountry} onClick={() => router.push(`/vipro-form/evaluation`)} className="disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full bg-brand-primary text-white font-semibold py-4 rounded-md hover:bg-brand-hover transition-colors shadow-md text-lg">
                                Empezar Evaluación <span className="pl-2">{selectedCountry}</span>
                            </button>
                            {/* <a href="#" className="text-sm text-brand-primary font-medium hover:underline text-center">
                            ¿Cómo realizo una compra?
                        </a> */}
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 h-[450px] md:h-[650px] relative rounded-[2rem] overflow-hidden shadow-2xl">
                        <img
                            src="/images/vipro_evaluation.png"
                            alt="Proceso de Visa"
                            className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                    </div>
                </div>

                <div className="w-full pt-12 border-t border-border-light flex flex-col items-center">
                    <h2 className="text-3xl md:text-4xl text-text-primary text-center mb-12 font-semibold">¿Cómo funciona la Evaluación VIPRO?</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl w-full">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-brand-light text-brand-primary rounded-full flex items-center justify-center text-2xl font-bold shadow-sm">1</div>
                            <h3 className="text-xl font-bold text-text-primary">Realiza tu compra</h3>
                            <p className="text-text-secondary leading-relaxed">Adquiere tu evaluación y obtén acceso inmediato a nuestro cuestionario especializado.</p>
                        </div>

                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-brand-light text-brand-primary rounded-full flex items-center justify-center text-2xl font-bold shadow-sm">2</div>
                            <h3 className="text-xl font-bold text-text-primary">Responde el cuestionario</h3>
                            <p className="text-text-secondary leading-relaxed">Completa un formulario detallado diseñado para analizar tu perfil y probabilidades de éxito.</p>
                        </div>

                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-brand-light text-brand-primary rounded-full flex items-center justify-center text-2xl font-bold shadow-sm">3</div>
                            <h3 className="text-xl font-bold text-text-primary">Recibe tu calificación</h3>
                            <p className="text-text-secondary leading-relaxed">Obtén un análisis completo con recomendaciones prácticas de mejora para tu caso específico.</p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};