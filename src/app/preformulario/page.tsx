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
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>("US");
    const [intakeVisaClass, setIntakeVisaClass] = useState<"turismo" | "estudios" | "trabajo" | "transito" | "">("");
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [completed, setCompleted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    
    const { user } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isMounted, setIsMounted] = useState(false);

    const config = countryConfigs[selectedCountryCode] || countryConfigs.US;
    const questions = config.questions;
    const countryName = config.name;
    const countryEmoji = config.emoji;

    useEffect(() => {
        setIsMounted(true);
        if (headerRef.current) {
            setHeaderHeight((headerRef.current as HTMLElement).offsetHeight);
        }
    }, []);

    // Set initial country from search parameters if valid
    useEffect(() => {
        const countryParam = searchParams.get("country")?.toUpperCase();
        if (countryParam && countryConfigs[countryParam]) {
            setSelectedCountryCode(countryParam);
        }
    }, [searchParams]);

    // Load active progress from localStorage or Supabase
    useEffect(() => {
        if (!user) return;
        
        const loadProgress = async () => {
            const targetUserId = searchParams.get("userId") || searchParams.get("user_id");
            const effectiveUserId = targetUserId || user.id;

            // Check if already completed first to lock the form
            try {
                const { data: dbCompleted } = await supabase
                    .from("preformularios")
                    .select("*")
                    .eq("user_id", effectiveUserId)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (dbCompleted?.answers) {
                    setAnswers(dbCompleted.answers);
                    if (dbCompleted.intake_visa_class) {
                        setIntakeVisaClass(dbCompleted.intake_visa_class as any);
                    }
                    if (dbCompleted.is_completed) {
                        setCompleted(true);
                        return;
                    }
                }

                if (!targetUserId && typeof window !== "undefined" && localStorage.getItem(`preformulario_completed_user_id_${user.id}`) === "true") {
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
                    .eq("user_id", effectiveUserId)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (!error && dbProgress && dbProgress.answers) {
                    savedAnswers = dbProgress.answers;
                    savedStep = dbProgress.current_step || 0;
                    hasSavedProgress = true;
                    if (dbProgress.intake_visa_class) setIntakeVisaClass(dbProgress.intake_visa_class as "turismo" | "estudios" | "trabajo" | "transito");
                    console.log("Restored preformulario progress from database.");
                }
            } catch (dbErr) {
                console.error("Failed to load progress from preformularios table:", dbErr);
            }


            // 2. Fallback to localStorage if no DB entry found
            if (!hasSavedProgress) {
                const localAnswers = localStorage.getItem(`preform_progress_answers_${selectedCountryCode}_${user.id}`);
                const localStep = localStorage.getItem(`preform_progress_step_${selectedCountryCode}_${user.id}`);
                const localIntakeVisa = localStorage.getItem(`preform_progress_intake_visa_${selectedCountryCode}_${user.id}`);

                if (localAnswers) {
                    try {
                        savedAnswers = JSON.parse(localAnswers);
                        savedStep = localStep ? Number(localStep) : 0;
                        if (localIntakeVisa) setIntakeVisaClass(localIntakeVisa as "turismo" | "estudios" | "trabajo" | "transito");
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
            } else {
                // Clear answers if starting fresh
                setAnswers({});
                setCurrentStep(0);
                setStarted(false);
            }
        };

        loadProgress();
    }, [user, selectedCountryCode]);

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

    const isAdminOrStaff = user && (user.role === "admin" || user.role === "moderator");
    if (!isAdminOrStaff && !user.hasPaidAdvisor) {

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

    const saveEvaluationProgress = async (newAnswers: Record<number, string>, step: number) => {
        if (!user) return;
        localStorage.setItem(`preform_progress_answers_${selectedCountryCode}_${user.id}`, JSON.stringify(newAnswers));
        localStorage.setItem(`preform_progress_step_${selectedCountryCode}_${user.id}`, String(step));
        localStorage.setItem(`preform_progress_intake_type_${selectedCountryCode}_${user.id}`, "first");
        if (intakeVisaClass) localStorage.setItem(`preform_progress_intake_visa_${selectedCountryCode}_${user.id}`, intakeVisaClass);

        try {
            // Save draft progress to Supabase
            const { data: existing } = await supabase
                .from("preformularios")
                .select("id")
                .eq("user_id", user.id)
                .eq("destination_country", selectedCountryCode)
                .eq("is_completed", false)
                .maybeSingle();

            if (existing) {
                await supabase
                    .from("preformularios")
                    .update({
                        answers: newAnswers,
                        current_step: step,
                        is_completed: false,
                        intake_type: "first",
                        intake_visa_class: intakeVisaClass || 'turismo',
                        interview_waiver_eligible: false
                    })
                    .eq("id", existing.id);
            } else {
                await supabase
                    .from("preformularios")
                    .insert([
                        {
                            user_id: user.id,
                            destination_country: selectedCountryCode,
                            answers: newAnswers,
                            current_step: step,
                            is_completed: false,
                            intake_type: "first",
                            intake_visa_class: intakeVisaClass || 'turismo',
                            interview_waiver_eligible: false
                        }
                    ]);
            }
        } catch (err) {
            console.error("Error auto-saving progress to Supabase preformularios:", err);
        }
    };

    const validateCurrentStep = (): string | null => {


        const q = questions[currentStep];
        const val = (answers[currentStep] || "").trim();
        const isRequired = q.required !== false;

        if (isRequired && !val) {
            return "Por favor ingresa o selecciona una respuesta antes de continuar.";
        }

        if (val) {
            const lowerQ = q.question.toLowerCase();
            const isPassportExpiry = lowerQ.includes("vencimiento") || lowerQ.includes("expiration") || (lowerQ.includes("pasaporte") && lowerQ.includes("vigencia"));
            const isBirthDate = lowerQ.includes("nacimiento") || lowerQ.includes("birth");

            if (isPassportExpiry) {
                const selectedDate = new Date(val);
                if (isNaN(selectedDate.getTime())) {
                    return "Por favor ingresa una fecha válida.";
                }
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffTime = selectedDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 180) {
                    return "⚠️ El pasaporte debe contar con una vigencia mínima mayor a 180 días (6 meses). Si tu pasaporte vence pronto o está vencido, renuévalo antes de solicitar tu visa.";
                }
            }

            if (isBirthDate) {
                const selectedDate = new Date(val);
                if (isNaN(selectedDate.getTime())) {
                    return "Por favor ingresa una fecha válida.";
                }
                const today = new Date();
                if (selectedDate > today) {
                    return "La fecha de nacimiento no puede ser una fecha futura.";
                }
            }
        }

        return null;
    };

    const handleNext = async () => {
        const error = validateCurrentStep();
        if (error) {
            setValidationError(error);
            return;
        }
        setValidationError(null);

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
                localStorage.removeItem(`preform_progress_answers_${selectedCountryCode}_${user.id}`);
                localStorage.removeItem(`preform_progress_step_${selectedCountryCode}_${user.id}`);
                
                // Save completed form status to Supabase
                const { data: existing } = await supabase
                    .from("preformularios")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("destination_country", selectedCountryCode)
                    .eq("is_completed", false)
                    .maybeSingle();

                if (existing) {
                    await supabase
                        .from("preformularios")
                        .update({
                            answers: answers,
                            is_completed: true,
                            intake_type: "first",
                            intake_visa_class: intakeVisaClass || 'turismo',
                            interview_waiver_eligible: false
                        })
                        .eq("id", existing.id);
                } else {
                    await supabase
                        .from("preformularios")
                        .insert([
                            {
                                user_id: user.id,
                                destination_country: selectedCountryCode,
                                answers: answers,
                                is_completed: true,
                                intake_type: "first",
                                intake_visa_class: intakeVisaClass || 'turismo',
                                interview_waiver_eligible: false
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
        setValidationError(null);
        const prevStep = currentStep - 1;
        if (currentStep > 0) {
            saveEvaluationProgress(answers, prevStep);
            setCurrentStep(prevStep);
        } else {
            setStarted(false);
        }
    };


    // Welcome Screen (Intake and Country Configuration combined)
    if (!started) {
        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main font-sans">
                <Header headerRef={headerRef} />
                <main className="w-full max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center flex-1">
                    <div className="bg-white rounded-[2rem] p-8 md:p-14 shadow-lg border border-border-light flex flex-col gap-8">
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border-light pb-8">
                            <div className="flex items-center gap-4">
                                <span className="text-5xl">{countryEmoji}</span>
                                <div className="text-left">
                                    <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">Fase 2: Expediente y Captación</span>
                                    <h1 className="text-3xl md:text-4xl font-serif text-text-primary font-semibold tracking-tight">Preformulario</h1>
                                </div>
                            </div>
                            
                            {/* Country Selector Dropdown */}
                            <div className="flex flex-col gap-1.5 items-start">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">País del Preformulario</label>
                                <select 
                                    value={selectedCountryCode}
                                    onChange={(e) => setSelectedCountryCode(e.target.value)}
                                    className="border border-border-light rounded-md px-4 py-2.5 text-text-primary bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all cursor-pointer shadow-sm text-sm font-medium min-w-[200px]"
                                >
                                    {Object.entries(countryConfigs).map(([code, details]) => (
                                        <option key={code} value={code}>
                                            {details.emoji} {details.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Visa Class Selector directly on Welcome Screen */}
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider text-left">Tipo de Visado Objetivo</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                        {/* Informative Box for Renewal */}
                        <div className="bg-blue-50/40 border border-blue-200/50 rounded-2xl p-6 text-left flex items-start gap-4 shadow-sm">
                            <span className="text-2xl mt-0.5">💡</span>
                            <div className="flex flex-col gap-1">
                                <span className="text-base font-serif font-semibold text-blue-900 italic">¿Trámite de Renovación?</span>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    Si ya posees o has tenido una visa anteriormente para este país y deseas realizar una renovación, <strong>no necesitas contratar planes ni completar este preformulario</strong>. Las renovaciones de visa son directas. Por favor, comunícate con nuestro equipo de asistencia para guiarte en tu renovación.
                                </p>
                            </div>
                        </div>

                        <div className="bg-background-main p-6 rounded-2xl border border-border-light flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="text-left">
                                <span className="text-xs font-semibold text-text-muted uppercase">Estructura del Preformulario</span>
                                <p className="text-text-primary font-bold text-lg">{questions.length} preguntas en total</p>
                            </div>
                            <button 
                                disabled={!intakeVisaClass}
                                onClick={() => {
                                    localStorage.setItem(`preform_progress_intake_type_${selectedCountryCode}_${user.id}`, "first");
                                    localStorage.setItem(`preform_progress_intake_visa_${selectedCountryCode}_${user.id}`, intakeVisaClass);
                                    saveEvaluationProgress(answers, currentStep);
                                    setStarted(true);
                                }}
                                className="w-full sm:w-auto bg-brand-primary disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-hover transition-colors shadow-md text-lg cursor-pointer"
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
                                    onClick={() => {
                                        setValidationError(null);
                                        setAnswers({ ...answers, [currentStep]: opt });
                                    }}
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
                                onChange={(e) => {
                                    setValidationError(null);
                                    setAnswers({ ...answers, [currentStep]: e.target.value });
                                }}
                                placeholder="Escribe tu respuesta aquí..."
                                className={`w-full border ${validationError ? 'border-red-400 focus:ring-red-200' : 'border-border-light focus:ring-brand-primary/50'} rounded-xl px-5 py-4 text-base md:text-lg text-text-primary bg-white focus:outline-none focus:ring-2 transition-all shadow-sm`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleNext();
                                    }
                                }}
                            />
                        )}
                    </div>

                    {/* Validation Error Banner */}
                    {validationError && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 text-xs md:text-sm font-semibold rounded-xl flex items-start gap-3 animate-in fade-in duration-200 text-left">
                            <span className="text-lg leading-none">⚠️</span>
                            <span className="leading-relaxed">{validationError}</span>
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
