"use client"

import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import agentsData from "../dummies/agents.json";
import supabase from "../lib/supabase";

function ViproFormContent() {
    const headerRef = useRef(null);
    const [_, setHeaderHeight] = useState<number | null>(null);
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [inProgressCountry, setInProgressCountry] = useState<string>("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const user = useAuthStore((state) => state.user);

    const countryMap: Record<string, { emoji: string; name: string }> = {
        US: { emoji: "🇺🇸", name: "Estados Unidos" },
        CA: { emoji: "🇨🇦", name: "Canadá" },
        MX: { emoji: "🇲🇽", name: "México" },
        UK: { emoji: "🇬🇧", name: "Inglaterra" },
        CN: { emoji: "🇨🇳", name: "China" },
        AU: { emoji: "🇦🇺", name: "Australia" },
        IN: { emoji: "🇮🇳", name: "India" }
    };

    const assignedAgent = useMemo(() => {
        return user?.assignedAgentId 
            ? (agentsData as any[]).find(a => a.id === user.assignedAgentId) 
            : null;
    }, [user?.assignedAgentId]);

    const availableCountries = useMemo(() => {
        return Object.entries(countryMap).filter(([_, details]) => {
            if (!assignedAgent) return true;
            return assignedAgent.countries.includes(details.name);
        });
    }, [assignedAgent]);

    const handleSelectCountry = (code: string) => {
        setSelectedCountryCode(code);
        setSelectedCountry(countryMap[code] ? `${countryMap[code].emoji} ${countryMap[code].name}` : null);
    };

    // Check if there is an in-progress evaluation
    useEffect(() => {
        const checkProgress = async () => {
            let dest = "";
            // Check local storage first
            if (typeof window !== "undefined") {
                const localDest = localStorage.getItem("vipro_progress_destination");
                const localAnswers = localStorage.getItem("vipro_progress_answers");
                if (localDest && localAnswers) {
                    try {
                        const parsed = JSON.parse(localAnswers);
                        if (Object.keys(parsed).length > 0) {
                            dest = localDest;
                        }
                    } catch (e) {}
                }
            }

            // If not in local storage and logged in, check supabase user metadata
            if (!dest && user) {
                try {
                    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
                    const metadata = supabaseUser?.user_metadata || {};
                    if (metadata.vipro_progress_destination && metadata.vipro_progress_answers) {
                        if (Object.keys(metadata.vipro_progress_answers).length > 0) {
                            dest = metadata.vipro_progress_destination;
                        }
                    }
                } catch (err) {
                    console.error("Error checking progress in Supabase:", err);
                }
            }

            if (dest) {
                setInProgressCountry(dest);
            }
        };

        checkProgress();
    }, [user]);

    useEffect(() => {
        const countryParam = searchParams.get("country")?.toUpperCase();
        if (countryParam && countryMap[countryParam]) {
            const isAvailable = availableCountries.some(([code]) => code === countryParam);
            if (isAvailable) {
                handleSelectCountry(countryParam);
            }
        }
    }, [searchParams, availableCountries]);

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
                            Nuestra Evaluación VIPRO de viabilidad analiza tu perfil consular y te brinda recomendaciones personalizadas impulsadas por IA para aumentar tus probabilidades de éxito.
                        </p>

                        {inProgressCountry ? (
                            /* In-progress State */
                            <div className="w-full bg-brand-light/45 border border-brand-primary/20 rounded-[1.5rem] p-6 md:p-8 flex flex-col gap-5 text-left shadow-sm">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">Cuestionario en Curso</span>
                                    <p className="text-lg font-serif font-semibold text-text-primary">
                                        Tienes una evaluación iniciada para {countryMap[inProgressCountry]?.emoji || "✈️"} {countryMap[inProgressCountry]?.name || inProgressCountry}
                                    </p>
                                </div>
                                <p className="text-sm text-text-secondary">
                                    Puedes continuar respondiendo donde lo dejaste para recibir tu reporte de viabilidad y puntaje consular.
                                </p>
                                <div className="flex mt-2">
                                    <button
                                        onClick={() => router.push(`/vipro-form/evaluation?country=${inProgressCountry}`)}
                                        className="w-full sm:w-auto bg-brand-primary text-white font-semibold py-3 px-8 rounded-md hover:bg-brand-hover transition-colors shadow-md text-sm cursor-pointer"
                                    >
                                        Continuar Evaluación
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Normal Country Selection State */
                            <>
                                <div className="w-full flex flex-col gap-2 mt-2">
                                    <label className="text-sm font-semibold text-text-primary text-left">Destino de viaje:</label>
                                    <select 
                                        value={selectedCountryCode}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            handleSelectCountry(val);
                                        }}
                                        className="w-full max-w-sm border border-border-light rounded-md px-4 py-3.5 text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all cursor-pointer shadow-sm"
                                    >
                                        <option value="">🌎 Selecciona un país...</option>
                                        {availableCountries.map(([code, details]) => (
                                            <option key={code} value={code}>
                                                {details.emoji} {details.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mt-2 flex flex-col gap-4 items-start">
                                    <div className="flex items-end gap-3">
                                        <span className="text-5xl font-bold text-text-primary">$19.99</span>
                                        <span className="text-sm text-text-secondary mb-1">USD</span>
                                    </div>
                                    <span className="text-sm font-medium text-brand-primary bg-brand-light px-4 py-1.5 rounded-full w-max">
                                        🎉 Recibirás un 25% de descuento en tu asesoría
                                    </span>
                                </div>

                                <div className="flex flex-col gap-4 mt-4 w-full max-w-sm">
                                    <button 
                                        disabled={!selectedCountryCode} 
                                        onClick={() => router.push(`/vipro-form/evaluation?country=${selectedCountryCode}`)} 
                                        className="disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full bg-brand-primary text-white font-semibold py-4 rounded-md hover:bg-brand-hover transition-colors shadow-md text-lg"
                                    >
                                        Empezar Evaluación <span className="pl-2">{selectedCountry}</span>
                                    </button>
                                </div>
                            </>
                        )}
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
}

export default function ViproFormPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex items-center justify-center bg-background-main">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-text-secondary font-medium">Cargando evaluación...</span>
                </div>
            </div>
        }>
            <ViproFormContent />
        </Suspense>
    );
}