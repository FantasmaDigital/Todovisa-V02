"use client"

import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import supabase from "../lib/supabase";
import { VIPROQuestionsUSA, VIPROInfoUSA } from "../constants/vipro/usa.vipro";
import { VIPROQuestionsUK, VIPROInfoUK } from "../constants/vipro/uk.vipro";

type VIPROQuestionsProps = {
    question: string;
    type_question: string;
    response: string[];
    user_response: string;
    category: string;
    required?: boolean;
}

type VIPROInfoProps = {
    info_text: string;
    category: string;
}

const countryConfigs: Record<string, { name: string; emoji: string; questions: VIPROQuestionsProps[]; info: VIPROInfoProps[] }> = {
    US: {
        name: "Estados Unidos",
        emoji: "🇺🇸",
        questions: VIPROQuestionsUSA,
        info: VIPROInfoUSA
    },
    UK: {
        name: "Inglaterra",
        emoji: "🇬🇧",
        questions: VIPROQuestionsUK,
        info: VIPROInfoUK
    }
};

const PILLARS = [
  { name: "IDENTIDAD", icon: "👤", desc: "Datos personales y pasaporte" },
  { name: "ARRAIGO", icon: "🏢", desc: "Trabajo, estudios y finanzas" },
  { name: "HISTORIAL DE VIAJES", icon: "✈️", desc: "Viajes previos y destino" },
  { name: "HISTORIAL CRIMINAL", icon: "🛡️", desc: "Seguridad y antecedentes" }
];

function getPillarIndex(category: string): number {
    const cat = category.toUpperCase();
    if (cat.includes("SEGURIDAD") || cat.includes("CRIMINAL") || cat.includes("LEGAL") || cat.includes("ANTECEDENTES")) {
        return 3;
    }
    if (cat.includes("VIAJE") || cat.includes("ITINERARIO") || cat.includes("DESTINO") || cat.includes("MIGRATORIO")) {
        return 2;
    }
    if (cat.includes("EMPLEO") || cat.includes("ESTUDIOS") || cat.includes("TRABAJO") || cat.includes("FINANZAS") || cat.includes("EDUCACIÓN") || cat.includes("INGRESOS") || cat.includes("ARRAIGO")) {
        return 1;
    }
    return 0;
}

function PreformularioContent() {
    const headerRef = useRef(null);
    const [headerHeight, setHeaderHeight] = useState<number | null>(null);
    const [started, setStarted] = useState(false);
    const [showIntake, setShowIntake] = useState(true);
    const [intakeType, setIntakeType] = useState<"first" | "renewal" | "">("");
    const [intakeVisaClass, setIntakeVisaClass] = useState<"turismo" | "estudios" | "trabajo" | "transito" | "">("");
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [completed, setCompleted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const { user, setUser } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isMounted, setIsMounted] = useState(false);

    const countryCode = (searchParams.get("country") || "US").toUpperCase();
    const config = countryConfigs[countryCode] || countryConfigs.US;
    const questions = config.questions;
    const countryName = config.name;
    const countryEmoji = config.emoji;

    // Filter information blocks
    const annexes = config.info.filter(item => {
        const text = item.info_text;
        return text.includes("ANEXO A") || text.includes("ANEXO B") || /^\d+\./.test(text) || /^PASO/.test(text) || text.includes("Esta guía describe");
    });

    const generalInstructions = config.info.filter(item => {
        const text = item.info_text;
        return text.includes("INSTRUCCIÓN") || text.includes("GENERAL") || text.includes("Por favor, responda");
    });

    const [openAnnexA, setOpenAnnexA] = useState(true);
    const [openAnnexB, setOpenAnnexB] = useState(false);
    const [showSidebarMobile, setShowSidebarMobile] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (headerRef.current) {
            setHeaderHeight((headerRef.current as HTMLElement).offsetHeight);
        }
    }, []);

    // Load active progress from localStorage or Supabase
    useEffect(() => {
        if (!user) return;
        
        const loadProgress = async () => {
            // Check if already completed first to lock the form
            try {
                const { data: dbCompleted } = await supabase
                    .from("preformularios")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("destination_country", countryCode)
                    .eq("is_completed", true)
                    .maybeSingle();

                if (dbCompleted || (typeof window !== "undefined" && localStorage.getItem(`preformulario_completed_user_id_${user.id}`) === "true")) {
                    setCompleted(true);
                    return;
                }
            } catch (err) {
                console.error("Error checking preformulario completion:", err);
            }

            let savedAnswers: Record<number, string> = {};
            let savedStep = 0;
            let hasSavedProgress = false;

            // 1. Try to load from Supabase 'preformularios' table first
            try {
                const { data: dbProgress, error } = await supabase
                    .from("preformularios")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("destination_country", countryCode)
                    .eq("is_completed", false)
                    .maybeSingle();

                if (!error && dbProgress && dbProgress.answers) {
                    savedAnswers = dbProgress.answers;
                    savedStep = dbProgress.current_step || 0;
                    hasSavedProgress = true;
                    console.log("Restored preformulario progress from database.");
                }
            } catch (dbErr) {
                console.error("Failed to load progress from preformularios table:", dbErr);
            }

            // 2. Fallback to localStorage if no DB entry found
            if (!hasSavedProgress) {
                const localAnswers = localStorage.getItem(`preform_progress_answers_${countryCode}_${user.id}`);
                const localStep = localStorage.getItem(`preform_progress_step_${countryCode}_${user.id}`);
                const localIntakeType = localStorage.getItem(`preform_progress_intake_type_${countryCode}_${user.id}`);
                const localIntakeVisa = localStorage.getItem(`preform_progress_intake_visa_${countryCode}_${user.id}`);

                if (localAnswers) {
                    try {
                        savedAnswers = JSON.parse(localAnswers);
                        savedStep = localStep ? Number(localStep) : 0;
                        if (localIntakeType) setIntakeType(localIntakeType as any);
                        if (localIntakeVisa) setIntakeVisaClass(localIntakeVisa as any);
                        hasSavedProgress = true;
                        console.log("Restored preformulario progress from localStorage.");
                    } catch (e) {
                        console.error("Error parsing local progress:", e);
                    }
                }
            }

            if (hasSavedProgress) {
                setAnswers(savedAnswers);
                setCurrentStep(savedStep);
                setStarted(true);
                setShowIntake(false);
            }
        };

        loadProgress();
    }, [user, countryCode]);

    if (!isMounted) {
        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main">
                <Header headerRef={headerRef} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin"></div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main">
                <Header headerRef={headerRef} />
                <main className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto my-12">
                    <div className="w-16 h-16 bg-brand-light text-brand-primary rounded-full flex items-center justify-center mb-6 text-2xl font-bold">
                        🔒
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-3">Acceso Restringido</h2>
                    <p className="text-sm text-text-secondary mb-8 leading-relaxed">
                        Debes iniciar sesión con tu cuenta para acceder al Preformulario.
                    </p>
                    <button
                        onClick={() => router.push("/auth/signin")}
                        className="w-full bg-brand-primary text-white font-semibold py-3 rounded-sm hover:bg-brand-hover transition-colors text-sm shadow-sm"
                    >
                        Iniciar Sesión
                    </button>
                </main>
                <Footer />
            </div>
        );
    }

    if (!user.hasPaidAdvisor) {
        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main">
                <Header headerRef={headerRef} />
                <main className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto gap-6 my-12">
                    <div className="w-20 h-20 bg-amber-50 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center text-3xl shadow-sm">
                        ⚠️
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-text-primary tracking-tight font-serif italic">Servicio Completo Requerido</h2>
                        <p className="text-base text-text-secondary max-w-md mx-auto leading-relaxed">
                            Este preformulario es de uso exclusivo para clientes que han adquirido el **Servicio Completo con Asesor** para coordinar su llenado oficial de visa.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/agents")}
                        className="bg-brand-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-brand-hover transition-colors text-sm shadow-md"
                    >
                        Ver Asesores e Iniciar
                    </button>
                </main>
                <Footer />
            </div>
        );
    }

    const question = questions[currentStep];

    const parseAnnexItem = (text: string) => {
        if (text.includes("ANEXO A") || text.includes("ANEXO B")) {
            return { type: 'header', text: text.trim() };
        }
        const stepMatch = text.match(/^(PASO\s+\d+):\s*(.*)/i);
        if (stepMatch) {
            return { type: 'step', number: stepMatch[1], title: stepMatch[2].split(".")[0], text: stepMatch[2] };
        }
        const bulletMatch = text.match(/^(\d+)\.\s*(.*)/);
        if (bulletMatch) {
            return { type: 'bullet', number: bulletMatch[1], title: bulletMatch[2].split(":")[0], text: bulletMatch[2].split(":").slice(1).join(":") || bulletMatch[2] };
        }
        return { type: 'text', text: text };
    };

    // Filter notes relevant to the current section
    const activeSectionKey = question.category.split(" ")[1] || "A.1";
    const sectionNotes = config.info.filter(item => {
        return item.category.toUpperCase().includes(activeSectionKey.toUpperCase()) && 
               !item.info_text.includes("ANEXO") && 
               !/^\d+\./.test(item.info_text);
    });

    const saveEvaluationProgress = async (newAnswers: Record<number, string>, step: number) => {
        if (!user) return;
        localStorage.setItem(`preform_progress_answers_${countryCode}_${user.id}`, JSON.stringify(newAnswers));
        localStorage.setItem(`preform_progress_step_${countryCode}_${user.id}`, String(step));
        if (intakeType) localStorage.setItem(`preform_progress_intake_type_${countryCode}_${user.id}`, intakeType);
        if (intakeVisaClass) localStorage.setItem(`preform_progress_intake_visa_${countryCode}_${user.id}`, intakeVisaClass);

        try {
            // Save draft progress to Supabase
            const { data: existing } = await supabase
                .from("preformularios")
                .select("id")
                .eq("user_id", user.id)
                .eq("destination_country", countryCode)
                .eq("is_completed", false)
                .maybeSingle();

            if (existing) {
                await supabase
                    .from("preformularios")
                    .update({
                        answers: newAnswers,
                        current_step: step,
                        is_completed: false
                    })
                    .eq("id", existing.id);
            } else {
                await supabase
                    .from("preformularios")
                    .insert([
                        {
                            user_id: user.id,
                            destination_country: countryCode,
                            answers: newAnswers,
                            current_step: step,
                            is_completed: false
                        }
                    ]);
            }
        } catch (err) {
            console.error("Error auto-saving progress to Supabase preformularios:", err);
        }
    };

    const handleNext = async () => {
        const nextStep = currentStep + 1;
        if (nextStep < questions.length) {
            saveEvaluationProgress(answers, nextStep);
            setCurrentStep(nextStep);
        } else {
            setIsSaving(true);
            try {
                // Save completion to localStorage
                localStorage.setItem(`preformulario_completed_user_id_${user.id}`, "true");
                
                // Clear active localStorage draft
                localStorage.removeItem(`preform_progress_answers_${countryCode}_${user.id}`);
                localStorage.removeItem(`preform_progress_step_${countryCode}_${user.id}`);
                
                // Save completed form status to Supabase
                const { data: existing } = await supabase
                    .from("preformularios")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("destination_country", countryCode)
                    .eq("is_completed", false)
                    .maybeSingle();

                if (existing) {
                    await supabase
                        .from("preformularios")
                        .update({
                            answers: answers,
                            is_completed: true
                        })
                        .eq("id", existing.id);
                } else {
                    await supabase
                        .from("preformularios")
                        .insert([
                            {
                                user_id: user.id,
                                destination_country: countryCode,
                                answers: answers,
                                is_completed: true
                            }
                        ]);
                }

                setCompleted(true);
            } catch (err) {
                console.error("Error completing preformulario:", err);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleBack = () => {
        const prevStep = currentStep - 1;
        if (currentStep > 0) {
            saveEvaluationProgress(answers, prevStep);
            setCurrentStep(prevStep);
        } else {
            setStarted(false);
        }
    };

    // Welcome Screen
    if (!started) {
        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main">
                <Header headerRef={headerRef} />
                <main className="w-full max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center flex-1">
                    <div className="bg-white rounded-[2rem] p-8 md:p-14 shadow-lg border border-border-light flex flex-col gap-8">
                        <div className="flex items-center gap-4 border-b border-border-light pb-6">
                            <span className="text-5xl">{countryEmoji}</span>
                            <div>
                                <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">Fase 2: Expediente y Captación</span>
                                <h1 className="text-3xl md:text-4xl font-serif text-text-primary font-semibold tracking-tight">Preformulario</h1>
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                            <h2 className="text-xl font-bold text-text-primary">Instrucciones Generales:</h2>
                            <div className="flex flex-col gap-4 text-text-secondary leading-relaxed">
                                <p className="bg-brand-light/30 border-l-4 border-brand-primary/40 p-4 rounded-r-xl text-base text-left">
                                    Por favor complete todos los campos de información personal, pasaporte, laboral y de seguridad con datos reales. Esta información se utilizará para que tu asesor complete el formulario oficial consular DS-160.
                                </p>
                            </div>
                        </div>

                        <div className="bg-background-main p-6 rounded-2xl border border-border-light flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <span className="text-xs font-semibold text-text-muted uppercase">Estructura del Preformulario</span>
                                <p className="text-text-primary font-bold text-lg">{questions.length} preguntas en total</p>
                            </div>
                            <button 
                                onClick={() => setStarted(true)}
                                className="w-full sm:w-auto bg-brand-primary text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-hover transition-colors shadow-md text-lg cursor-pointer"
                            >
                                Empezar Preformulario →
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Paso 0: Intake Form
    if (started && showIntake) {
        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main font-sans">
                <Header headerRef={headerRef} />
                <main className="w-full max-w-2xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center flex-1">
                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-border-light flex flex-col gap-8 animate-in fade-in duration-300">
                        <div className="text-center">
                            <span className="text-4xl">🎯</span>
                            <span className="block text-xs font-bold tracking-widest text-brand-primary uppercase mt-3">PASO 0: Configuración del Trámite</span>
                            <h2 className="text-2xl md:text-3xl font-serif text-text-primary font-semibold italic mt-2">Configura tu Preformulario</h2>
                            <p className="text-xs text-text-secondary leading-relaxed mt-2 max-w-md mx-auto">
                                Antes de iniciar, configura el tipo de trámite y la categoría de visado a la que deseas aplicar.
                            </p>
                        </div>

                        {/* Tipo de Trámite Selector */}
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider text-left">1. Tipo de Solicitud</label>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: "first", title: "Primera Vez", desc: "Nunca he tenido visa para este país" },
                                    { id: "renewal", title: "Renovación", desc: "Tengo o tuve visa y quiero renovarla" }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setIntakeType(item.id as any)}
                                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                                            intakeType === item.id 
                                                ? "border-brand-primary bg-brand-light/30 ring-1 ring-brand-primary font-bold" 
                                                : "border-border-light bg-white hover:bg-background-hover/30"
                                        }`}
                                    >
                                        <p className="text-sm font-bold text-text-primary">{item.title}</p>
                                        <p className="text-[10px] text-text-secondary leading-relaxed mt-1">{item.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Visa Class Selector */}
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider text-left">2. Tipo de Visado Objetivo</label>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: "turismo", label: "✈️ Turismo / Negocios", desc: "Visa B1/B2 o visitante regular" },
                                    { id: "estudios", label: "🎓 Estudios / Intercambio", desc: "Visa académica o intercambio estudiantil" },
                                    { id: "trabajo", label: "💼 Trabajo / Empleo", desc: "Visa laboral de empleo temporal" },
                                    { id: "transito", label: "🚢 Tránsito / Tripulante", desc: "Visa para tripulaciones aéreas o marítimas" }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setIntakeVisaClass(item.id as any)}
                                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                                            intakeVisaClass === item.id 
                                                ? "border-brand-primary bg-brand-light/30 ring-1 ring-brand-primary font-bold" 
                                                : "border-border-light bg-white hover:bg-background-hover/30"
                                        }`}
                                    >
                                        <p className="text-sm font-bold text-text-primary">{item.label}</p>
                                        <p className="text-[10px] text-text-secondary leading-relaxed mt-1">{item.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="pt-4 border-t border-border-light flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStarted(false)}
                                className="px-5 py-3 rounded-xl border border-border-light text-text-secondary font-semibold hover:bg-background-hover transition-all text-sm cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={!intakeType || !intakeVisaClass}
                                onClick={() => {
                                    localStorage.setItem(`preform_progress_intake_type_${countryCode}_${user.id}`, intakeType);
                                    localStorage.setItem(`preform_progress_intake_visa_${countryCode}_${user.id}`, intakeVisaClass);
                                    setShowIntake(false);
                                    saveEvaluationProgress({}, 0);
                                }}
                                className="flex-1 py-3 bg-brand-primary hover:bg-brand-hover disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer"
                            >
                                Continuar al Preformulario →
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Success / Completed Screen
    if (completed) {
        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main font-sans">
                <Header headerRef={headerRef} />
                <main className="w-full max-w-3xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center flex-1">
                    <div className="bg-white rounded-3xl p-8 md:p-14 shadow-xl border border-border-light flex flex-col gap-10 text-center items-center">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl shadow-inner animate-pulse">
                            ✓
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-3xl md:text-4xl font-serif text-text-primary font-bold italic">¡Preformulario Completado!</h1>
                            <p className="text-text-secondary text-base max-w-lg leading-relaxed">
                                Tu preformulario de captación para {countryEmoji} {countryName} ha sido completado con éxito.
                            </p>
                        </div>

                        <div className="bg-brand-light/35 border border-brand-primary/10 rounded-2xl p-6 max-w-md w-full text-left space-y-3">
                            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block">Siguiente Paso</span>
                            <p className="text-xs text-text-primary font-bold leading-normal">
                                Tu asesor asignado ha recibido tu expediente. Se comunicará contigo mediante el chat de tu portal para agendar la primera revisión virtual.
                            </p>
                            <p className="text-[11px] text-text-secondary leading-relaxed">
                                Puedes verificar el estatus del trámite o enviarle un mensaje a tu asesor en cualquier momento desde tu panel de usuario.
                            </p>
                        </div>

                        <button 
                            onClick={() => router.push("/profile")}
                            className="bg-brand-primary text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-brand-hover transition-colors shadow-md text-sm cursor-pointer"
                        >
                            Ir a Mi Panel de Usuario
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col relative bg-background-main font-sans">
            <Header headerRef={headerRef} />
            
            <main className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-10 flex flex-col gap-6 flex-1">
                
                {/* Mobile action bar for sidebar display */}
                <div className="lg:hidden w-full flex justify-between items-center bg-white p-4 rounded-2xl border border-border-light shadow-sm">
                    <span className="text-xs font-bold text-text-secondary uppercase">
                        Preformulario {countryEmoji}
                    </span>
                    <button 
                        onClick={() => setShowSidebarMobile(!showSidebarMobile)}
                        className="bg-brand-light text-brand-primary text-xs font-bold px-4 py-2.5 rounded-lg border border-brand-primary/10 flex items-center gap-2"
                    >
                        📋 {showSidebarMobile ? "Ocultar Guía" : "Ver Guía y Requisitos"}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
                    
                    {/* LEFT/MAIN QUESTION COL */}
                    <div className="lg:col-span-2 flex flex-col gap-6 w-full">
                        
                        {/* 4 Pilares Stepper */}
                        <div className="w-full bg-white rounded-2xl p-6 border border-border-light shadow-sm flex flex-col gap-6">
                            <div className="grid grid-cols-4 gap-2">
                                {PILLARS.map((p, idx) => {
                                    const activePillar = getPillarIndex(question.category);
                                    const isCurrent = activePillar === idx;
                                    const isPassed = activePillar > idx;
                                    return (
                                        <div key={p.name} className="flex flex-col items-center text-center gap-1.5 relative">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                                isCurrent 
                                                    ? "bg-brand-primary text-white ring-4 ring-brand-primary/20 scale-110" 
                                                    : isPassed 
                                                    ? "bg-emerald-500 text-white shadow-sm" 
                                                    : "bg-gray-100 text-text-muted border border-border-light"
                                            }`}>
                                                {isPassed ? "✓" : p.icon}
                                            </div>
                                            <span className={`text-[9px] font-extrabold tracking-wider uppercase transition-colors duration-300 ${
                                                isCurrent ? "text-brand-primary font-bold" : "text-text-secondary/70 font-medium"
                                            }`}>
                                                {p.name}
                                            </span>
                                            <span className="hidden md:block text-[8px] text-text-muted leading-tight font-medium max-w-[100px] mt-0.5">
                                                {p.desc}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <hr className="border-border-light" />

                            {/* Sub-Progress Bar */}
                            <div>
                                <div className="flex justify-between text-[10px] text-text-secondary font-bold mb-2 uppercase tracking-wider text-left">
                                    <span>Pregunta {currentStep + 1} de {questions.length} ({question.category.replace(/\[cite:\s*\d+\]/g, "").trim()})</span>
                                    <span>{Math.round(((currentStep + 1) / questions.length) * 100)}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden text-left">
                                    <div
                                        className="h-full bg-brand-primary transition-all duration-500 ease-out"
                                        style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Question container */}
                        <div className="w-full bg-white rounded-[2rem] p-6 md:p-12 border border-border-light shadow-sm">
                            <div className="flex items-center mb-6">
                                <span className="text-[10px] font-bold tracking-widest text-brand-primary uppercase border border-brand-primary/20 rounded-md px-3 py-1.5 bg-brand-light">
                                    {question.category.replace(/\[cite:\s*\d+\]/g, "").trim()}
                                </span>
                            </div>

                            <h2 className="text-2xl md:text-3xl font-serif text-text-primary leading-tight mb-8 tracking-tight font-medium text-left">
                                {question.question.replace(/\[cite:\s*\d+\]/g, "").trim()}
                                {question.required === false && (
                                    <span className="text-sm font-sans font-normal text-text-secondary/60 ml-2">
                                        (Opcional)
                                    </span>
                                )}
                            </h2>

                            <div className="flex flex-col gap-4 text-left">
                                {question.type_question === "opcion multiple" ? (
                                    question.response.map((opt, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setAnswers({ ...answers, [currentStep]: opt })}
                                            className={`flex items-center gap-4 p-4 md:p-5 rounded-xl border cursor-pointer transition-all duration-200 ${answers[currentStep] === opt
                                                    ? 'border-brand-primary bg-brand-light/30 shadow-sm ring-1 ring-brand-primary'
                                                    : 'border-border-light bg-white hover:border-brand-primary/40 hover:bg-background-hover/40'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${answers[currentStep] === opt ? 'border-brand-primary' : 'border-gray-300'}`}>
                                                {answers[currentStep] === opt && <div className="w-2.5 h-2.5 bg-brand-primary rounded-full"></div>}
                                            </div>
                                            <span className="text-base md:text-lg text-text-primary font-medium">{opt}</span>
                                        </div>
                                    ))
                                ) : (
                                    <input
                                        type={
                                            question.question.toLowerCase().includes('fecha') || 
                                            question.question.toLowerCase().includes('date') || 
                                            question.question.toLowerCase().includes('vencimiento') ||
                                            question.question.toLowerCase().includes('expedición')
                                                ? 'date' 
                                                : 'text'
                                        }
                                        value={answers[currentStep] || ''}
                                        onChange={(e) => setAnswers({ ...answers, [currentStep]: e.target.value })}
                                        placeholder="Escribe tu respuesta aquí..."
                                        className="w-full border border-border-light rounded-xl px-5 py-4 text-base md:text-lg text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all shadow-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const isRequired = question.required !== false;
                                                const hasAnswer = answers[currentStep] !== undefined && answers[currentStep] !== null && answers[currentStep].trim() !== '';
                                                if (!isRequired || hasAnswer) {
                                                    handleNext();
                                                }
                                            }
                                        }}
                                    />
                                )}
                            </div>

                            {sectionNotes.length > 0 && (
                                <div className="mt-8 bg-brand-light/40 border border-brand-primary/10 rounded-2xl p-5 flex flex-col gap-2 text-left">
                                    <span className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-1.5">
                                        ℹ️ Nota de la Sección
                                    </span>
                                    {sectionNotes.map((note, idx) => (
                                        <p key={idx} className="text-text-secondary text-sm leading-relaxed">
                                            {note.info_text.replace(/\[cite:\s*\d+\]/g, "").trim()}
                                        </p>
                                    ))}
                                </div>
                            )}

                            <div className="mt-10 pt-6 border-t border-border-light flex items-center justify-between">
                                <button
                                    onClick={handleBack}
                                    className="font-semibold px-6 py-3 rounded-lg border border-border-light text-text-primary hover:bg-background-hover transition-colors shadow-sm text-sm md:text-base cursor-pointer"
                                >
                                    Atrás
                                </button>
                                <button
                                    disabled={isSaving || (question.required !== false && (answers[currentStep] === undefined || answers[currentStep] === null || answers[currentStep].trim() === ''))}
                                    onClick={handleNext}
                                    className="bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm md:text-base cursor-pointer flex items-center gap-2"
                                >
                                    {isSaving ? "Guardando..." : currentStep === questions.length - 1 ? 'Finalizar Preformulario' : 'Siguiente'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className={`w-full lg:col-span-1 flex flex-col gap-6 ${showSidebarMobile ? 'block' : 'hidden lg:flex'}`}>
                        <div className="bg-white rounded-2xl p-6 border border-border-light shadow-sm flex flex-col gap-4">
                            <h2 className="text-xl font-serif text-text-primary font-bold border-b border-border-light pb-3 text-left">
                                Guía & Requisitos {countryEmoji}
                            </h2>

                            <div className="border border-border-light rounded-xl overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setOpenAnnexA(!openAnnexA)}
                                    className="w-full flex justify-between items-center px-4 py-3 bg-brand-light/20 hover:bg-brand-light/40 transition-colors text-left"
                                >
                                    <span className="font-bold text-sm text-text-primary flex items-center gap-2">
                                        📋 Requisitos y Documentos
                                    </span>
                                    <svg
                                        className={`w-4 h-4 text-text-secondary transition-transform duration-300 ${openAnnexA ? "rotate-180" : ""}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {openAnnexA && (
                                    <div className="p-4 bg-white text-xs text-text-secondary divide-y divide-border-light/60 flex flex-col max-h-96 overflow-y-auto text-left">
                                        {annexes.filter(item => item.info_text.includes("ANEXO A")).map((item, idx) => {
                                            const parsed = parseAnnexItem(item.info_text);
                                            if (parsed.type === 'header') return null;
                                            return (
                                                <div key={idx} className="py-2.5 flex flex-col gap-1">
                                                    {parsed.title && (
                                                        <span className="font-bold text-text-primary uppercase tracking-wide text-[10px]">
                                                            {parsed.title}
                                                        </span>
                                                    )}
                                                    <p className="leading-relaxed">{parsed.text}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="bg-[#FAF9F6] border border-border-light p-4 rounded-xl flex flex-col gap-2 text-left">
                                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider block">Soporte Volamos Viajes</span>
                                <p className="font-bold text-xs text-text-primary">Asesoría Certificada</p>
                                <div className="text-[11px] text-text-secondary flex flex-col gap-1 leading-normal">
                                    <span>💬 WhatsApp: 7020-0976</span>
                                    <span>✉️ Email: reservas1@volamosviajes.com</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default function PreformularioPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex items-center justify-center bg-background-main">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-text-secondary font-medium">Cargando preformulario...</span>
                </div>
            </div>
        }>
            <PreformularioContent />
        </Suspense>
    );
}
