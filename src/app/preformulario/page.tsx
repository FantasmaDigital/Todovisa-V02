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
    
    // New state variables for screener
    const [showScreener, setShowScreener] = useState(false);
    const [screenerAnswers, setScreenerAnswers] = useState<Record<string, boolean>>({});
    const [isWaiverEligible, setIsWaiverEligible] = useState<boolean | null>(null);
    const [showScreenerResult, setShowScreenerResult] = useState(false);
    
    const { user, setUser } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isMounted, setIsMounted] = useState(false);

    const countryCode = (searchParams.get("country") || "US").toUpperCase();
    const config = countryConfigs[countryCode] || countryConfigs.US;
    const questions = config.questions;
    const countryName = config.name;
    const countryEmoji = config.emoji;

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
                    if (dbProgress.intake_type) setIntakeType(dbProgress.intake_type as "first" | "renewal");
                    if (dbProgress.intake_visa_class) setIntakeVisaClass(dbProgress.intake_visa_class as "turismo" | "estudios" | "trabajo" | "transito");
                    if (dbProgress.interview_waiver_eligible !== undefined && dbProgress.interview_waiver_eligible !== null) {
                        setIsWaiverEligible(dbProgress.interview_waiver_eligible);
                    }
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
                const localWaiverEligible = localStorage.getItem(`preform_progress_waiver_eligible_${countryCode}_${user.id}`);

                if (localAnswers) {
                    try {
                        savedAnswers = JSON.parse(localAnswers);
                        savedStep = localStep ? Number(localStep) : 0;
                        if (localIntakeType) setIntakeType(localIntakeType as "first" | "renewal");
                        if (localIntakeVisa) setIntakeVisaClass(localIntakeVisa as "turismo" | "estudios" | "trabajo" | "transito");
                        if (localWaiverEligible) setIsWaiverEligible(localWaiverEligible === "true");
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



    const saveEvaluationProgress = async (newAnswers: Record<number, string>, step: number, waiverEligible: boolean | null = isWaiverEligible) => {
        if (!user) return;
        localStorage.setItem(`preform_progress_answers_${countryCode}_${user.id}`, JSON.stringify(newAnswers));
        localStorage.setItem(`preform_progress_step_${countryCode}_${user.id}`, String(step));
        if (intakeType) localStorage.setItem(`preform_progress_intake_type_${countryCode}_${user.id}`, intakeType);
        if (intakeVisaClass) localStorage.setItem(`preform_progress_intake_visa_${countryCode}_${user.id}`, intakeVisaClass);
        if (waiverEligible !== null) localStorage.setItem(`preform_progress_waiver_eligible_${countryCode}_${user.id}`, String(waiverEligible));

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
                        is_completed: false,
                        intake_type: intakeType || 'first',
                        intake_visa_class: intakeVisaClass || 'turismo',
                        interview_waiver_eligible: waiverEligible
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
                            is_completed: false,
                            intake_type: intakeType || 'first',
                            intake_visa_class: intakeVisaClass || 'turismo',
                            interview_waiver_eligible: waiverEligible
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
                            is_completed: true,
                            intake_type: intakeType || 'first',
                            intake_visa_class: intakeVisaClass || 'turismo',
                            interview_waiver_eligible: isWaiverEligible
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
                                is_completed: true,
                                intake_type: intakeType || 'first',
                                intake_visa_class: intakeVisaClass || 'turismo',
                                interview_waiver_eligible: isWaiverEligible
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
                                        onClick={() => setIntakeType(item.id as "first" | "renewal")}
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
                                        onClick={() => setIntakeVisaClass(item.id as "turismo" | "estudios" | "trabajo" | "transito")}
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
                                    
                                    if (intakeType === "renewal") {
                                        setShowIntake(false);
                                        setShowScreener(true);
                                    } else {
                                        setIsWaiverEligible(false);
                                        setShowIntake(false);
                                        saveEvaluationProgress({}, 0, false);
                                    }
                                }}
                                className="flex-1 py-3 bg-brand-primary hover:bg-brand-hover disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer"
                            >
                                Continuar →
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Paso 0.5: Screener de Elegibilidad para Renovación
    if (started && showScreener) {
        const SCREENER_QUESTIONS = [
            {
                id: "same_category",
                text: "¿Tu visa a renovar es de la misma categoría que estás solicitando actualmente? (por ejemplo, ambas son B1/B2 o ambas son F1)",
                expected: true,
            },
            {
                id: "issued_same_country",
                text: "¿Tu visa anterior fue emitida en el mismo país desde el que estás aplicando actualmente?",
                expected: true,
            },
            {
                id: "valid_or_expired_48m",
                text: "¿Tu visa anterior aún se encuentra vigente o venció hace menos de 48 meses?",
                expected: true,
            },
            {
                id: "fingerprints_given",
                text: "¿Tenías al menos 14 años de edad cuando se emitió tu visa anterior y se te tomaron las huellas dactilares (los 10 dedos) en la Embajada?",
                expected: true,
            },
            {
                id: "passport_in_possession",
                text: "¿Tienes en tu posesión física el pasaporte anterior que contiene la visa que deseas renovar?",
                expected: true,
            },
            {
                id: "no_refusal_since",
                text: "¿Te han negado alguna solicitud de visa para este país desde que se emitió tu última visa?",
                expected: false,
            },
            {
                id: "not_lost_stolen_revoked",
                text: "¿Tu visa anterior ha sido extraviada, robada, cancelada o revocada alguna vez?",
                expected: false,
            }
        ];

        const allQuestionsAnswered = SCREENER_QUESTIONS.every(q => screenerAnswers[q.id] !== undefined);

        const handleEvaluateWaiver = () => {
            const isEligible = SCREENER_QUESTIONS.every(q => {
                const answer = screenerAnswers[q.id];
                return answer === q.expected;
            });
            setIsWaiverEligible(isEligible);
            setShowScreenerResult(true);
        };

        if (showScreenerResult) {
            return (
                <div className="min-h-screen w-full flex flex-col relative bg-background-main font-sans">
                    <Header headerRef={headerRef} />
                    <main className="w-full max-w-2xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center flex-1">
                        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-border-light flex flex-col gap-8 animate-in fade-in duration-300">
                            <div className="text-center">
                                <span className="text-4xl">{isWaiverEligible ? "🎉" : "ℹ️"}</span>
                                <span className="block text-xs font-bold tracking-widest text-brand-primary uppercase mt-3">Resultado del Diagnóstico</span>
                                <h2 className="text-2xl md:text-3xl font-serif text-text-primary font-semibold italic mt-2">
                                    {isWaiverEligible ? "¡Apto para Exención de Entrevista!" : "Renovación con Entrevista"}
                                </h2>
                            </div>

                            {isWaiverEligible ? (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-left space-y-3">
                                    <p className="text-sm text-emerald-950 font-bold">
                                        Calificas para el programa de exención de entrevista consular (Dropbox / Buzón).
                                    </p>
                                    <p className="text-xs text-emerald-900/90 leading-relaxed">
                                        Esto significa que no necesitarás asistir a una entrevista con un oficial consular en la Embajada. Tu trámite consistirá en el llenado de formularios y el depósito físico de tus documentos en una oficina autorizada. Tu panel de control se actualizará automáticamente con estos pasos simplificados.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-left space-y-3">
                                    <p className="text-sm text-blue-950 font-bold">
                                        Deberás programar y asistir a una entrevista presencial.
                                    </p>
                                    <p className="text-xs text-blue-900/90 leading-relaxed">
                                        Debido a tus respuestas (por ejemplo, vencimiento mayor a 48 meses o no poseer el pasaporte físico anterior), la sección consular requiere tu presencia física. No te preocupes, el proceso de renovación sigue siendo más ágil y te guiaremos detalladamente para programar tus citas y preparar tu entrevista.
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-border-light flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowScreenerResult(false);
                                        setIsWaiverEligible(null);
                                    }}
                                    className="px-5 py-3 rounded-xl border border-border-light text-text-secondary font-semibold hover:bg-background-hover transition-all text-sm cursor-pointer"
                                >
                                    Corregir Respuestas
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowScreener(false);
                                        saveEvaluationProgress({}, 0, isWaiverEligible);
                                    }}
                                    className="flex-1 py-3 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer text-center"
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

        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main font-sans">
                <Header headerRef={headerRef} />
                <main className="w-full max-w-2xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center flex-1">
                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-border-light flex flex-col gap-8 animate-in fade-in duration-300">
                        <div className="text-center">
                            <span className="text-4xl">📝</span>
                            <span className="block text-xs font-bold tracking-widest text-brand-primary uppercase mt-3">PASO 0.5: Diagnóstico de Exención</span>
                            <h2 className="text-2xl md:text-3xl font-serif text-text-primary font-semibold italic mt-2">¿Calificas para renovación sin entrevista?</h2>
                            <p className="text-xs text-text-secondary leading-relaxed mt-2">
                                Responde estas preguntas para verificar si la Embajada te permite realizar el trámite mediante buzón (Drop-box) sin entrevista presencial.
                            </p>
                        </div>

                        <div className="space-y-6 text-left max-h-[400px] overflow-y-auto pr-2">
                            {SCREENER_QUESTIONS.map((q, idx) => (
                                <div key={q.id} className="pb-4 border-b border-border-light last:border-b-0 space-y-3">
                                    <p className="text-sm font-medium text-text-primary">
                                        {idx + 1}. {q.text}
                                    </p>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setScreenerAnswers({ ...screenerAnswers, [q.id]: true })}
                                            className={`px-6 py-2 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                                                screenerAnswers[q.id] === true
                                                    ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                                                    : "bg-white text-text-primary border-border-light hover:bg-background-hover/30"
                                            }`}
                                        >
                                            Sí
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setScreenerAnswers({ ...screenerAnswers, [q.id]: false })}
                                            className={`px-6 py-2 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                                                screenerAnswers[q.id] === false
                                                    ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                                                    : "bg-white text-text-primary border-border-light hover:bg-background-hover/30"
                                            }`}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-border-light flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowScreener(false);
                                    setShowIntake(true);
                                }}
                                className="px-5 py-3 rounded-xl border border-border-light text-text-secondary font-semibold hover:bg-background-hover transition-all text-sm cursor-pointer"
                            >
                                Atrás
                            </button>
                            <button
                                type="button"
                                disabled={!allQuestionsAnswered}
                                onClick={handleEvaluateWaiver}
                                className="flex-1 py-3 bg-brand-primary hover:bg-brand-hover disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer"
                            >
                                Evaluar Calificación →
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
            
            <main className="w-full max-w-3xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-6 flex-1">
                
                {/* Sub-Progress Bar */}
                <div className="w-full bg-white rounded-2xl p-6 border border-border-light shadow-sm flex flex-col gap-3">
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
