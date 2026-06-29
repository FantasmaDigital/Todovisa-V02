"use client"

import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { CheckoutModal } from "../components/shared/CheckoutModal";
import agentsData from "../dummies/agents.json";
import supabase from "../lib/supabase";

function ViproFormContent() {
    const headerRef = useRef(null);
    const [_, setHeaderHeight] = useState<number | null>(null);
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const { user } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [activeProgressCountry, setActiveProgressCountry] = useState<string | null>(null);
    const [isLoadingProgress, setIsLoadingProgress] = useState(true);

    useEffect(() => {
        const checkActiveProgress = async () => {
            // If user is not logged in or has not paid, do not show active progress
            if (!user || (!user.hasPaidVipro && !user.hasPaidAdvisor)) {
                setActiveProgressCountry(null);
                setIsLoadingProgress(false);
                return;
            }

            let activeCountry: string | null = null;
            
            // 1. Check vipro_evaluations table for in-progress row
            try {
                const { data: draftRow } = await supabase
                    .from("vipro_evaluations")
                    .select("destination_country")
                    .eq("user_id", user.id)
                    .eq("is_completed", false)
                    .order("created_at", { ascending: false })
                    .maybeSingle();

                if (draftRow?.destination_country) {
                    activeCountry = draftRow.destination_country;
                }
            } catch (err) {
                console.error("Error checking active progress from vipro_evaluations:", err);
            }
            
            // 2. Fallback: check localStorage if DB is unavailable or no draft found
            if (!activeCountry && typeof window !== "undefined") {
                const localDest = localStorage.getItem("vipro_progress_destination");
                if (localDest) {
                    activeCountry = localDest;
                }
            }
            
            // 3. Check user store destination (from completed evaluation)
            if (!activeCountry && !user.viproCompleted && user.viproDestination) {
                activeCountry = user.viproDestination;
            }
            
            // If the user has already completed VIPRO, no active pending one
            if (user.viproCompleted) {
                activeCountry = null;
            }
            
            setActiveProgressCountry(activeCountry);
            setIsLoadingProgress(false);
        };
        
        checkActiveProgress();
    }, [user]);

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
            : (user?.hasPaidAdvisor ? agentsData[0] : null);
    }, [user?.assignedAgentId, user?.hasPaidAdvisor]);

    const availableCountries = useMemo(() => {
        return Object.entries(countryMap).filter(([_, details]) => {
            if (user?.hasPaidAdvisor && assignedAgent) {
                return assignedAgent.countries.includes(details.name);
            }
            return true;
        });
    }, [assignedAgent, user?.hasPaidAdvisor]);

    const handleSelectCountry = (code: string) => {
        setSelectedCountryCode(code);
        setSelectedCountry(countryMap[code] ? `${countryMap[code].emoji} ${countryMap[code].name}` : null);
    };

    const handleStartEvaluation = () => {
        if (!user) {
            alert("Por favor, inicia sesión para poder realizar tu evaluación VIPRO.");
            router.push("/auth/signin");
            return;
        }

        if (!selectedCountryCode) {
            alert("Por favor, selecciona un país de destino.");
            return;
        }

        if (user.hasPaidVipro || user.hasPaidAdvisor) {
            router.push(`/vipro-form/evaluation?country=${selectedCountryCode}`);
        } else {
            setIsCheckoutOpen(true);
        }
    };



    useEffect(() => {
        // Accept both ?country=XX (internal links) and ?destination=XX (from hero search)
        const countryParam = (searchParams.get("country") || searchParams.get("destination"))?.toUpperCase();
        if (countryParam && countryMap[countryParam]) {
            handleSelectCountry(countryParam);
        }
    }, [searchParams]);

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

                        {isLoadingProgress ? (
                            <div className="w-full max-w-sm flex items-center justify-center py-10">
                                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : activeProgressCountry ? (
                            <>
                                <div className="w-full flex flex-col gap-2 mt-2">
                                    <label className="text-sm font-semibold text-text-primary">Destino de viaje:</label>
                                    <div className="w-full max-w-sm border border-brand-primary/20 bg-brand-light/35 rounded-xl p-4 flex items-center gap-3 shadow-sm font-medium bg-white">
                                        <span className="text-2xl">{countryMap[activeProgressCountry]?.emoji || "🌎"}</span>
                                        <div>
                                            <p className="text-xs font-bold text-brand-primary">Evaluación Activa en Progreso</p>
                                            <p className="text-xs text-text-primary font-semibold mt-0.5">
                                                Destino: {countryMap[activeProgressCountry]?.name || activeProgressCountry}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2 flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                        <span>Servicio Habilitado</span>
                                    </div>
                                    <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
                                        Ya tienes una evaluación VIPRO en curso para este destino. Puedes continuar respondiendo el cuestionario para obtener tu calificación.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-4 mt-4 w-full max-w-sm">
                                    <button 
                                        onClick={() => {
                                            if (!user) {
                                                router.push(`/auth/signin?redirect=/vipro-form/evaluation?country=${activeProgressCountry}`);
                                                return;
                                            }
                                            router.push(`/vipro-form/evaluation?country=${activeProgressCountry}`);
                                        }} 
                                        className="cursor-pointer w-full bg-brand-primary text-white font-bold py-4 rounded-md hover:bg-brand-hover transition-colors shadow-md text-lg flex items-center justify-center gap-2 border-0"
                                    >
                                        Continuar Evaluación {countryMap[activeProgressCountry] && <span className="pl-1">{countryMap[activeProgressCountry].emoji}</span>}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-full flex flex-col gap-2 mt-2">
                                    <label className="text-sm font-semibold text-text-primary">Destino de viaje:</label>
                                    <select 
                                        value={selectedCountryCode}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            handleSelectCountry(val);
                                        }}
                                        className="w-full max-w-sm border border-border-light rounded-md px-4 py-3.5 text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all cursor-pointer shadow-sm font-medium"
                                    >
                                        <option value="">🌎 Selecciona un país...</option>
                                        {availableCountries.map(([code, details]) => (
                                            <option key={code} value={code}>
                                                {details.emoji} {details.name}
                                            </option>
                                        ))}
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
                                    <button 
                                        disabled={!selectedCountryCode} 
                                        onClick={handleStartEvaluation} 
                                        className="disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full bg-brand-primary text-white font-semibold py-4 rounded-md hover:bg-brand-hover transition-colors shadow-md text-lg"
                                    >
                                        Empezar Evaluación {selectedCountry && <span className="pl-2">{selectedCountry}</span>}
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
            {isCheckoutOpen && (
                <CheckoutModal
                    product="vipro"
                    onClose={() => setIsCheckoutOpen(false)}
                    onSuccess={() => {
                        setIsCheckoutOpen(false);
                        router.push(`/vipro-form/evaluation?country=${selectedCountryCode}`);
                    }}
                />
            )}
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