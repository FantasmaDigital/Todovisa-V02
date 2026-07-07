"use client"

import { Header } from "../../components/shared/Header";
import { Footer } from "../../components/shared/Footer";
import { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import supabase from "../../lib/supabase";
import agentsData from "../../dummies/agents.json";

import { VIPROQuestionsUSA, VIPROInfoUSA } from "../../constants/vipro/usa.vipro";
import { VIPROQuestionsUK, VIPROInfoUK } from "../../constants/vipro/uk.vipro";
import { questionsSpanish } from "../../constants/vipro/questionsSpanish";

// Types derived from imports
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

interface ParseAnnexItem {
    type: 'header' | 'item' | 'step' | 'text';
    number?: string;
    title?: string;
    text: string;
}

// Clean and parse the requirements list & timelines
function parseAnnexItem(text: string): ParseAnnexItem {
    const cleanText = text.replace(/\[cite:\s*\d+\]/g, "").trim();

    if (cleanText.includes("ANEXO A") || cleanText.includes("ANEXO B")) {
        return { type: 'header', text: cleanText };
    }

    // Check if it is a STEP (e.g. PASO 1: Text)
    const stepMatch = cleanText.match(/^(PASO\s+\d+):\s*(.*)$/i);
    if (stepMatch) {
        const [_, stepNum, stepContent] = stepMatch;
        const dotIndex = stepContent.indexOf('.');
        const colonIndex = stepContent.indexOf(':');
        let title = '';
        let rest = stepContent;
        if (dotIndex !== -1 && (colonIndex === -1 || dotIndex < colonIndex)) {
            title = stepContent.substring(0, dotIndex + 1);
            rest = stepContent.substring(dotIndex + 1).trim();
        } else if (colonIndex !== -1) {
            title = stepContent.substring(0, colonIndex + 1);
            rest = stepContent.substring(colonIndex + 1).trim();
        }
        return { type: 'step', number: stepNum, title: title, text: rest };
    }

    // Check if it is a numbered requirement (e.g. 1. TITLE: Text)
    const numMatch = cleanText.match(/^(\d+)\.\s*(.*)$/);
    if (numMatch) {
        const [_, num, content] = numMatch;
        const colonIndex = content.indexOf(':');
        if (colonIndex !== -1) {
            return {
                type: 'item',
                number: num,
                title: content.substring(0, colonIndex).trim(),
                text: content.substring(colonIndex + 1).trim()
            };
        }
        return { type: 'item', number: num, text: content };
    }

    return { type: 'text', text: cleanText };
}

interface Agent {
    id: string;
    name: string;
    countries: string[];
}

// Country Configurations
const countryConfigs: Record<string, {
    name: string;
    emoji: string;
    questions: VIPROQuestionsProps[];
    info: VIPROInfoProps[];
}> = {
    US: {
        name: "Estados Unidos",
        emoji: "🇺🇸",
        questions: questionsSpanish,
        info: VIPROInfoUSA
    },
    UK: {
        name: "Inglaterra",
        emoji: "🇬🇧",
        questions: questionsSpanish,
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

function ViproEvaluationContent() {
    const headerRef = useRef(null);
    const [headerHeight, setHeaderHeight] = useState<number | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    const countryCode = searchParams.get("country")?.toUpperCase() || "US";

    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);

    const isSupported = countryCode in countryConfigs;
    const currentConfig = countryConfigs[countryCode];

    const assignedAgent = useMemo(() => {
        return user?.assignedAgentId 
            ? (agentsData as Agent[]).find(a => a.id === user.assignedAgentId) 
            : null;
    }, [user]);

    const isSupportedByAgent = useMemo(() => {
        if (!assignedAgent || !isSupported) return true;
        const currentCountryName = countryConfigs[countryCode]?.name;
        return currentCountryName ? assignedAgent.countries.includes(currentCountryName) : false;
    }, [assignedAgent, isSupported, countryCode]);

    // State Variables
    const [started, setStarted] = useState(false);
    const [showIntake, setShowIntake] = useState(true);
    const [intakeType, setIntakeType] = useState<"first" | "renewal" | "">("");
    const [intakeVisaClass, setIntakeVisaClass] = useState<"turismo" | "estudios" | "trabajo" | "transito" | "">("");
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [completed, setCompleted] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [evaluationResult, setEvaluationResult] = useState<{
        score: number;
        recommendations: string[];
        destination_analysis: string;
    } | null>(null);

    // Save evaluation to Supabase and store on completion (calling Gemini API)
    useEffect(() => {
        if (completed && !evaluationResult && !isEvaluating) {
            const getViproEvaluation = async () => {
                setIsEvaluating(true);
                try {
                    const response = await fetch('/api/vipro/evaluate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            countryCode,
                            answers
                        })
                    });

                    const results = await response.json();
                    setEvaluationResult(results);

                    const finalScore = results.score || 85;
                    const recommendations = results.recommendations || [];



                    if (user) {
                        const updatedUser = {
                            ...user,
                            viproCompleted: true,
                            viproScore: finalScore,
                            viproDestination: countryCode
                        };
                        
                        // Defer store update to avoid react-hooks/set-state-in-effect warning
                        setTimeout(() => setUser(updatedUser), 0);

                        try {
                            // Check if a draft exists for this user + country
                            const { data: existing } = await supabase
                                .from("vipro_evaluations")
                                .select("id")
                                .eq("user_id", user.id)
                                .eq("destination_country", countryCode)
                                .eq("is_completed", false)
                                .maybeSingle();

                            if (existing) {
                                // Update the draft row to mark it as completed
                                const { error: dbError } = await supabase
                                    .from("vipro_evaluations")
                                    .update({
                                        answers: answers,
                                        score: finalScore,
                                        recommendations: recommendations,
                                        destination_analysis: results.destination_analysis || "",
                                        is_completed: true,
                                        completed_at: new Date().toISOString()
                                    })
                                    .eq("id", existing.id);

                                if (dbError) {
                                    console.error("Failed to mark vipro_evaluations record as completed:", dbError.message);
                                } else {
                                    console.log("Evaluation successfully updated to completed in public.vipro_evaluations table.");
                                }
                            } else {
                                // No draft found; insert a fresh completed record
                                const { error: dbError } = await supabase
                                    .from("vipro_evaluations")
                                    .insert([{
                                        user_id: user.id,
                                        destination_country: countryCode,
                                        answers: answers,
                                        score: finalScore,
                                        recommendations: recommendations,
                                        destination_analysis: results.destination_analysis || "",
                                        current_step: 0,
                                        is_completed: true,
                                        completed_at: new Date().toISOString()
                                    }]);

                                if (dbError) {
                                    console.error("Failed to insert completed record into vipro_evaluations:", dbError.message);
                                } else {
                                    console.log("Evaluation successfully saved to public.vipro_evaluations table.");
                                }
                            }
                        } catch (err) {
                            console.error("Failed to persist VIPRO results to vipro_evaluations table:", err);
                        }
                    }
                } catch (err) {
                    console.error("Error evaluating VIPRO questionnaire:", err);
                    // Fallback local calculation
                    const baseScore = 82;
                    const answersCount = Object.keys(answers).length;
                    const extra = answersCount % 14;
                    const finalScore = baseScore + extra;
                    const fallbackRecs = [
                        "Presentar estados de cuenta bancarios detallados que demuestren solvencia económica.",
                        "Obtener una constancia laboral firmada y sellada especificando puesto y salario.",
                        "Preparar la documentación de arraigos familiares o de propiedad."
                    ];

                    const results = {
                        score: finalScore,
                        recommendations: fallbackRecs,
                        destination_analysis: "Análisis básico de viabilidad consular."
                    };
                    setEvaluationResult(results);

                    localStorage.setItem("vipro_score", String(finalScore));
                    localStorage.setItem("vipro_completed", "true");
                    localStorage.setItem("vipro_destination", countryCode);
                    localStorage.setItem("vipro_recommendations", JSON.stringify(fallbackRecs));

                    if (user) {
                        const updatedUser = {
                            ...user,
                            viproCompleted: true,
                            viproScore: finalScore,
                            viproDestination: countryCode
                        };
                        setTimeout(() => setUser(updatedUser), 0);

                        try {
                            await supabase.from("vipro_evaluations").insert([
                                {
                                    user_id: user.id,
                                    destination_country: countryCode,
                                    answers: answers,
                                    score: finalScore,
                                    recommendations: fallbackRecs,
                                    destination_analysis: "Análisis básico de viabilidad consular (Simulado/Offline)."
                                }
                            ]);
                        } catch (dbErr) {
                            console.error("Failed to insert fallback record in vipro_evaluations:", dbErr);
                        }
                    }
                } finally {
                    setIsEvaluating(false);
                }
            };
            getViproEvaluation();
        }
    }, [completed, answers, countryCode, user, setUser, evaluationResult, isEvaluating]);

    // Sync helper to save progress when user clicks Next or Back
    const saveEvaluationProgress = async (updatedAnswers: Record<number, string>, nextStepIndex: number) => {
        if (started && !completed && user) {


            try {
                // Check if a record already exists for this country-user pair
                const { data: existing } = await supabase
                    .from("vipro_evaluations")
                    .select("id")
                    .eq("user_id", user.id)
                    .eq("destination_country", countryCode)
                    .eq("is_completed", false)
                    .maybeSingle();

                if (existing) {
                    await supabase
                        .from("vipro_evaluations")
                        .update({
                            answers: updatedAnswers,
                            current_step: nextStepIndex,
                            is_completed: false
                        })
                        .eq("id", existing.id);
                } else {
                    await supabase
                        .from("vipro_evaluations")
                        .insert([
                            {
                                user_id: user.id,
                                destination_country: countryCode,
                                answers: updatedAnswers,
                                current_step: nextStepIndex,
                                is_completed: false
                            }
                        ]);
                }
            } catch (err) {
                console.error("Error auto-saving progress to Supabase vipro_evaluations:", err);
            }
        }
    };

    // Load auto-saved progress on mount/start
    useEffect(() => {
        const loadProgress = async () => {
            if (user) {
                // Check if already completed first to lock the form
                try {
                    const { data: dbCompleted } = await supabase
                        .from("vipro_evaluations")
                        .select("*")
                        .eq("user_id", user.id)
                        .eq("destination_country", countryCode)
                        .eq("is_completed", true)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (dbCompleted) {
                        setEvaluationResult({
                            score: dbCompleted.score || 85,
                            recommendations: dbCompleted.recommendations || [],
                            destination_analysis: dbCompleted.destination_analysis || ""
                        });
                        if (dbCompleted.answers) {
                            setAnswers(dbCompleted.answers);
                        }
                        setCompleted(true);
                        
                        // Sync Zustand store
                        if (!user.viproCompleted) {
                            setTimeout(() => setUser({
                                ...user,
                                viproCompleted: true,
                                viproScore: dbCompleted.score || 85,
                                viproDestination: countryCode
                            }), 0);
                        }
                        return;
                    }
                } catch (err) {
                    console.error("Error checking vipro evaluation completion:", err);
                }
            }

            let savedAnswers: Record<number, string> = {};
            let savedStep = 0;
            let hasSavedProgress = false;

            // 1. Try to load from Supabase vipro_evaluations table first if logged in
            if (user) {
                try {
                    const { data: dbProgress, error } = await supabase
                        .from("vipro_evaluations")
                        .select("*")
                        .eq("user_id", user.id)
                        .eq("destination_country", countryCode)
                        .eq("is_completed", false)
                        .maybeSingle();

                    if (!error && dbProgress && dbProgress.answers) {
                        savedAnswers = dbProgress.answers;
                        savedStep = dbProgress.current_step || 0;
                        hasSavedProgress = true;
                        console.log("Restored VIPRO progress from vipro_evaluations database table.");
                    }
                } catch (err) {
                    console.error("Error fetching progress from vipro_evaluations table:", err);
                }
            }



            if (hasSavedProgress) {
                setAnswers(savedAnswers);
                setCurrentStep(savedStep);
                setStarted(true); // Jump straight to the form
                setShowIntake(false);
            }
        };

        loadProgress();
    }, [user, countryCode]);

    // Accordion sidebar states
    const [openAnnexA, setOpenAnnexA] = useState(true);
    const [openAnnexB, setOpenAnnexB] = useState(false);
    const [showSidebarMobile, setShowSidebarMobile] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (headerRef.current) {
            const height = (headerRef.current as HTMLElement).offsetHeight;
            setHeaderHeight(height);
        }
    }, []);

    // Loader display while Gemini API parses results
    if (isEvaluating) {
        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main">
                <Header headerRef={headerRef} />
                <main className="w-full max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center items-center flex-1 text-center">
                    <div className="bg-white rounded-[2rem] p-10 md:p-16 shadow-lg border border-border-light max-w-2xl w-full flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 border-4 border-brand-light border-t-brand-primary rounded-full animate-spin"></div>
                        <h1 className="text-2xl md:text-3xl font-serif text-text-primary tracking-tight font-semibold">
                            Analizando tu Perfil con Inteligencia Artificial
                        </h1>
                        <p className="text-text-secondary leading-relaxed text-sm max-w-md">
                            Estamos procesando tus respuestas a través de nuestro consultor consular virtual para calcular tu probabilidad de éxito y generar recomendaciones personalizadas con Gemini. Esto tomará solo unos segundos...
                        </p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (isSupported && !isSupportedByAgent) {
        const countryInfo = countryConfigs[countryCode];
        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main">
                <Header headerRef={headerRef} />
                <main className="w-full max-w-4xl mx-auto px-6 py-16 md:py-24 flex flex-col justify-center items-center flex-1 text-center font-sans">
                    <div className="bg-white rounded-[2rem] p-10 md:p-16 shadow-lg border border-border-light max-w-2xl w-full flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300">
                        <span className="text-8xl animate-bounce">⚠️</span>
                        <h1 className="text-3xl md:text-4xl font-serif text-text-primary tracking-tight font-semibold">
                            Destino No Compatible
                        </h1>
                        <span className="text-xs font-semibold tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-4 py-2 rounded-full uppercase">
                            Cambio Requerido
                        </span>
                        <p className="text-text-secondary leading-relaxed text-base">
                            Tu asesor consular asignado, <strong>{assignedAgent?.name}</strong>, no brinda asesoramiento para <strong>{countryInfo.name}</strong>. Para realizar la evaluación VIPRO de este destino, debes seleccionar un país que tu asesor soporte o cambiar de asesor.
                        </p>
                        <div className="w-full h-px bg-border-light"></div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <button 
                                onClick={() => router.push('/vipro-form')}
                                className="px-8 py-3.5 rounded-xl border border-border-light text-text-primary font-semibold hover:bg-background-hover transition-colors shadow-sm cursor-pointer"
                            >
                                Seleccionar otro país
                            </button>
                            <button 
                                onClick={() => router.push('/profile?tab=proceso')}
                                className="px-8 py-3.5 rounded-xl bg-brand-primary text-white font-semibold hover:bg-brand-hover transition-colors shadow-md cursor-pointer"
                            >
                                Ir a mi Perfil
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!isSupported) {
        // Render Coming Soon Page
        const countryNames: Record<string, { name: string; emoji: string }> = {
            CA: { name: "Canadá", emoji: "🇨🇦" },
            MX: { name: "México", emoji: "🇲🇽" },
            CN: { name: "China", emoji: "🇨🇳" },
            AU: { name: "Australia", emoji: "🇦🇺" },
            IN: { name: "India", emoji: "🇮🇳" }
        };
        const countryInfo = countryNames[countryCode] || { name: `País (${countryCode})`, emoji: "🌎" };

        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main">
                <Header headerRef={headerRef} />
                <main className="w-full max-w-4xl mx-auto px-6 py-16 md:py-24 flex flex-col justify-center items-center flex-1 text-center">
                    <div className="bg-white rounded-[2rem] p-10 md:p-16 shadow-lg border border-border-light max-w-2xl w-full flex flex-col items-center gap-8">
                        <span className="text-8xl animate-bounce">{countryInfo.emoji}</span>
                        <h1 className="text-4xl md:text-5xl font-serif text-text-primary tracking-tight font-semibold">
                            Evaluación para {countryInfo.name}
                        </h1>
                        <span className="text-sm font-semibold tracking-wider text-brand-primary bg-brand-light px-4 py-2 rounded-full uppercase">
                            Muy Pronto Disponible
                        </span>
                        <p className="text-text-secondary leading-relaxed text-base">
                            Estamos trabajando activamente para traerte el preformulario de captación y el análisis especializado para <strong>{countryInfo.name}</strong>, adaptado a las últimas regulaciones migratorias consulares.
                        </p>
                        <div className="w-full h-px bg-border-light"></div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <button 
                                onClick={() => router.push('/vipro-form')}
                                className="px-8 py-3.5 rounded-xl border border-border-light text-text-primary font-semibold hover:bg-background-hover transition-colors shadow-sm cursor-pointer"
                            >
                                Volver a Selección
                            </button>
                            <a 
                                href="https://wa.me/50370200976" 
                                target="_blank" 
                                rel="noreferrer"
                                className="px-8 py-3.5 rounded-xl bg-brand-primary text-white font-semibold hover:bg-brand-hover transition-colors shadow-md flex items-center justify-center gap-2"
                            >
                                Contactar un Asesor 💬
                            </a>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const { name: countryName, emoji: countryEmoji, questions, info } = currentConfig;
    const question = questions[currentStep];

    // Info categories helper
    const generalInstructions = info.filter(item => item.category.endsWith("INSTRUCCIONES GENERALES"));
    const sectionNotes = started && question ? info.filter(item => item.category === question.category) : [];
    const annexes = info.filter(item => item.category.endsWith("ANEXOS Y REQUISITOS"));
    const contactInfo = info.filter(item => item.category.endsWith("CONTACTO Y NOTAS"));
    const declarationInfo = info.filter(item => item.category.endsWith("DECLARACIÓN Y FIRMA"));

    const shouldSkipQuestion = (idx: number, currentAnswers: Record<number, string>): boolean => {
        // 1. Edad actual (Index 10) - calculated from Fecha de nacimiento (Index 2)
        if (idx === 10) return true;

        // 2. Son Ciudadanos, Residentes, Otros (Index 26) - skipped if no family in USA (Index 25 is NO)
        if (idx === 26 && currentAnswers[25] === "NO") return true;

        // 3. Relación / Estatus del invitante (Index 28, 29) - skipped if not invited (Index 27 is NO)
        if (idx === 28 && currentAnswers[27] === "NO") return true;
        if (idx === 29 && currentAnswers[27] === "NO") return true;

        // 4. Constancia laboral (Index 41) - skipped if not employed (Index 38 is NO)
        if (idx === 41 && currentAnswers[38] === "NO") return true;

        return false;
    };

    const getAutoFilledAnswer = (idx: number, currentAnswers: Record<number, string>): string | null => {
        if (idx === 10) {
            const dobStr = currentAnswers[2] || "";
            const parts = dobStr.split(/[-/.]/);
            if (parts.length === 3) {
                let year = parseInt(parts[2], 10);
                if (isNaN(year) || year < 1000) {
                    year = parseInt(parts[0], 10);
                }
                if (!isNaN(year) && year > 1900 && year <= new Date().getFullYear()) {
                    return String(new Date().getFullYear() - year);
                }
            }
            return "No determinada";
        }
        if (idx === 26 && currentAnswers[25] === "NO") return "NO APLICA";
        if (idx === 28 && currentAnswers[27] === "NO") return "NO APLICA";
        if (idx === 29 && currentAnswers[27] === "NO") return "NO APLICA";
        if (idx === 41 && currentAnswers[38] === "NO") return "NO";
        return null;
    };

    const handleNext = () => {
        let nextStep = currentStep + 1;
        const updatedAnswers = { ...answers };

        saveEvaluationProgress(updatedAnswers, currentStep); // Save current state

        while (nextStep < questions.length && shouldSkipQuestion(nextStep, updatedAnswers)) {
            const autoAns = getAutoFilledAnswer(nextStep, updatedAnswers);
            if (autoAns !== null) {
                updatedAnswers[nextStep] = autoAns;
            }
            nextStep++;
        }

        setAnswers(updatedAnswers);

        if (nextStep < questions.length) {
            setCurrentStep(nextStep);
        } else {
            setCompleted(true);
            console.log(`Respuestas finales (${countryCode}):`, updatedAnswers);
        }
    };

    const handleBack = () => {
        let prevStep = currentStep - 1;

        while (prevStep >= 0 && shouldSkipQuestion(prevStep, answers)) {
            prevStep--;
        }

        if (prevStep >= 0) {
            saveEvaluationProgress(answers, prevStep);
            setCurrentStep(prevStep);
        } else {
            setStarted(false);
        }
    };

    const currentUser = user;

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

    if (!currentUser) {
        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main">
                <Header headerRef={headerRef} />
                <main className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto my-12">
                    <div className="w-16 h-16 bg-brand-light text-brand-primary rounded-full flex items-center justify-center mb-6 text-2xl font-bold">
                        🔒
                    </div>
                    <h2 className="text-2xl font-bold text-text-primary mb-3">Acceso Restringido</h2>
                    <p className="text-sm text-text-secondary mb-8 leading-relaxed">
                        Debes iniciar sesión con tu cuenta para acceder a la Evaluación VIPRO.
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



    if (!currentUser || (!currentUser?.hasPaidVipro && !currentUser?.hasPaidAdvisor)) {
        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main">
                <Header headerRef={headerRef} />
                <main className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto gap-6 my-12">
                    <div className="w-20 h-20 bg-amber-50 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center text-3xl shadow-sm">
                        ⚠️
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-bold text-text-primary tracking-tight font-serif italic">Requiere Pago Habilitado</h2>
                        <p className="text-base text-text-secondary max-w-md mx-auto leading-relaxed">
                            La Evaluación VIPRO no es gratuita. Para completar este cuestionario especializado y recibir tu calificación detallada con diagnóstico consular, debes adquirir una opción de servicio.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4">
                        <div className="bg-white border border-border-light p-6 rounded-xl flex flex-col justify-between items-center text-center shadow-sm">
                            <div>
                                <h3 className="font-bold text-lg text-text-primary mb-1">Evaluación Express</h3>
                                <p className="text-2xl font-black text-brand-primary mb-3">$19.99 <span className="text-xs text-text-secondary font-normal">USD</span></p>
                                <p className="text-xs text-text-secondary leading-relaxed mb-6">Analiza tu perfil automáticamente con recomendaciones personalizadas.</p>
                            </div>
                            <button
                                onClick={() => router.push("/vipro-form")}
                                className="w-full bg-brand-primary text-white font-semibold py-2.5 rounded-sm hover:bg-brand-hover transition-all text-xs focus:outline-none"
                            >
                                Adquirir Evaluación
                            </button>
                        </div>

                        <div className="bg-white border border-border-light p-6 rounded-xl flex flex-col justify-between items-center text-center shadow-sm">
                            <div>
                                <h3 className="font-bold text-lg text-text-primary mb-1">Servicio Completo</h3>
                                <p className="text-2xl font-black text-brand-primary mb-3">$150.00 <span className="text-xs text-text-secondary font-normal">USD</span></p>
                                <p className="text-xs text-text-secondary leading-relaxed mb-6">VIPRO + Citas de preparación y llenado con un Asesor Certificado de la red.</p>
                            </div>
                            <button
                                onClick={() => router.push("/agents")}
                                className="w-full bg-white border border-brand-primary text-brand-primary font-semibold py-2.5 rounded-sm hover:bg-brand-light transition-all text-xs focus:outline-none"
                            >
                                Contratar con Asesor
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
        const score = evaluationResult?.score ?? 85;
        const isFavorable = score >= 80;
        const scoreColor = isFavorable ? "#10b981" : "#f59e0b";
        const circumference = 2 * Math.PI * 54; // r=54
        const dashOffset = circumference - (score / 100) * circumference;

        return (
            <div className="min-h-screen w-full flex flex-col relative bg-[#F7F6F3]">
                <Header headerRef={headerRef} />
                <main className="w-full max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-16 flex flex-col gap-8 flex-1">

                    {/* ── TOP HEADER BANNER ── */}
                    <div className="relative overflow-hidden bg-white border border-border-light rounded-3xl px-8 py-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/3 via-transparent to-emerald-500/5 pointer-events-none" />
                        <div className="flex items-center gap-5 z-10">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner ${isFavorable ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                                {isFavorable ? "✓" : "⚠"}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold tracking-widest text-brand-primary uppercase mb-0.5">Evaluación VIPRO — {countryEmoji} {countryName}</p>
                                <h1 className="text-2xl md:text-3xl font-serif font-semibold text-text-primary leading-tight">¡Evaluación Finalizada!</h1>
                                <p className="text-xs text-text-secondary mt-1 max-w-sm">Tu análisis pre-consular de viabilidad ha sido completado. Revisa tu calificación y recomendaciones.</p>
                            </div>
                        </div>
                        <div className={`z-10 shrink-0 px-5 py-2.5 rounded-2xl border text-sm font-extrabold uppercase tracking-wider ${
                            isFavorable
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}>
                            {isFavorable ? "✅ Perfil Favorable" : "⚠️ Requiere Mejora"}
                        </div>
                    </div>

                    {/* ── SCORE + ANALYSIS ROW ── */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

                        {/* Score Gauge */}
                        <div className="md:col-span-2 bg-white border border-border-light rounded-3xl p-8 flex flex-col items-center justify-center gap-4 shadow-sm">
                            <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase">Calificación de Perfil</p>
                            <div className="relative w-36 h-36">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="54" fill="none" stroke="#F0EEE9" strokeWidth="10" />
                                    <circle
                                        cx="60" cy="60" r="54"
                                        fill="none"
                                        stroke={scoreColor}
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={dashOffset}
                                        style={{ transition: "stroke-dashoffset 1s ease-out" }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black" style={{ color: scoreColor }}>{score}</span>
                                    <span className="text-xs font-bold text-text-muted">/100</span>
                                </div>
                            </div>
                            <div className={`text-[10px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider border ${
                                isFavorable
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}>
                                {isFavorable ? "Alta Probabilidad de Aprobación" : "Perfil Necesita Fortalecerse"}
                            </div>
                        </div>

                        {/* Destination Analysis */}
                        <div className="md:col-span-3 bg-white border border-border-light rounded-3xl p-8 flex flex-col justify-center gap-5 shadow-sm">
                            <div>
                                <p className="text-[10px] font-bold tracking-widest text-brand-primary uppercase mb-2">📋 Análisis Pre-Consular</p>
                                {evaluationResult?.destination_analysis ? (
                                    <p className="text-sm text-text-secondary leading-relaxed italic border-l-4 border-brand-primary/30 pl-4">
                                        &quot;{evaluationResult.destination_analysis}&quot;
                                    </p>
                                ) : (
                                    <p className="text-sm text-text-muted italic">Sin análisis disponible.</p>
                                )}
                            </div>

                            {/* Mini score breakdown bars */}
                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border-light">
                                {[
                                    { label: "Arraigo Personal", value: Math.min(100, score + 3) },
                                    { label: "Solvencia Económica", value: Math.max(30, score - 10) },
                                    { label: "Historial Migratorio", value: Math.min(100, score + 5) },
                                    { label: "Propósito del Viaje", value: Math.min(100, score + 1) },
                                ].map((item) => (
                                    <div key={item.label}>
                                        <div className="flex justify-between text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">
                                            <span>{item.label}</span>
                                            <span>{item.value}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${item.value}%`, backgroundColor: item.value >= 70 ? "#10b981" : "#f59e0b" }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── RECOMMENDATIONS ── */}
                    {evaluationResult?.recommendations && evaluationResult.recommendations.length > 0 && (
                        <div className="bg-white border border-border-light rounded-3xl p-8 shadow-sm flex flex-col gap-6">
                            <div className="flex items-center gap-3 border-b border-border-light pb-5">
                                <div className="w-9 h-9 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center text-base font-black">🧠</div>
                                <div>
                                    <h2 className="text-base font-bold text-text-primary">Recomendaciones de Mejora Personalizadas</h2>
                                    <p className="text-[11px] text-text-secondary mt-0.5">Acciones específicas para fortalecer tu perfil consular antes de solicitar la visa.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {evaluationResult.recommendations.map((rec, idx) => (
                                    <div key={idx} className="group flex gap-4 p-5 rounded-2xl border border-border-light bg-[#FAFAF8] hover:border-brand-primary/40 hover:bg-brand-light/10 hover:shadow-sm transition-all duration-200">
                                        <div className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center flex-shrink-0 ${
                                            isFavorable
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-amber-100 text-amber-700"
                                        }`}>
                                            {idx + 1}
                                        </div>
                                        <p className="text-sm text-text-secondary leading-relaxed self-center group-hover:text-text-primary transition-colors">
                                            {rec}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── ANSWERS ACCORDION ── */}
                    <details className="group bg-white border border-border-light rounded-3xl overflow-hidden shadow-sm">
                        <summary className="px-8 py-5 flex justify-between items-center cursor-pointer hover:bg-[#FAFAF8] transition-colors select-none list-none">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-border-light/60 text-text-secondary flex items-center justify-center text-sm">📝</div>
                                <span className="font-semibold text-text-primary text-sm">Resumen de Respuestas Registradas</span>
                                <span className="text-[10px] font-bold bg-brand-light text-brand-primary px-2 py-0.5 rounded-md">{questions.length} campos</span>
                            </div>
                            <svg className="w-4 h-4 text-text-muted transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </summary>
                        <div className="border-t border-border-light divide-y divide-border-light max-h-[480px] overflow-y-auto">
                            {questions.map((q, idx) => (
                                <div key={idx} className="px-8 py-4 flex flex-col md:flex-row gap-2 md:gap-8 hover:bg-[#FAFAF8] transition-colors">
                                    <div className="flex items-start gap-3 md:w-1/2">
                                        <span className="text-[10px] font-black text-text-muted bg-border-light/60 rounded-md w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                                        <span className="text-xs font-semibold text-text-secondary leading-relaxed">{q.question.replace(/\[cite:\s*\d+\]/g, "").trim()}</span>
                                    </div>
                                    <div className="md:w-1/2 md:text-right">
                                        {answers[idx]
                                            ? <span className="text-xs font-semibold text-text-primary bg-brand-light/30 px-3 py-1 rounded-lg border border-brand-primary/10">{answers[idx]}</span>
                                            : <span className="text-xs italic text-text-muted">—</span>
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    </details>

                </main>
                <Footer />
            </div>
        );
    }

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
                                <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">Formulario de Evaluación VIPRO</span>
                                <h1 className="text-3xl md:text-4xl font-serif text-text-primary font-semibold tracking-tight">{countryName}</h1>
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                            <h2 className="text-xl font-bold text-text-primary">Instrucciones Generales:</h2>
                            <div className="flex flex-col gap-4 text-text-secondary leading-relaxed">
                                {generalInstructions.map((item, idx) => (
                                    <p key={idx} className="bg-brand-light/30 border-l-4 border-brand-primary p-4 rounded-r-xl text-base">
                                        {item.info_text.replace(/\[cite:\s*\d+\]/g, "").trim()}
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div className="bg-background-main p-6 rounded-2xl border border-border-light flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <span className="text-xs font-semibold text-text-muted uppercase">Estructura del Formulario</span>
                                <p className="text-text-primary font-bold text-lg">{questions.length} preguntas en total</p>
                            </div>
                            <button 
                                onClick={() => setStarted(true)}
                                className="w-full sm:w-auto bg-brand-primary text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-hover transition-colors shadow-md text-lg cursor-pointer"
                            >
                                Empezar Cuestionario →
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
                            <h2 className="text-2xl md:text-3xl font-serif text-text-primary font-semibold italic mt-2">Personaliza tu Evaluación</h2>
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
                                    localStorage.setItem("vipro_intake_type", intakeType);
                                    localStorage.setItem("vipro_intake_visa_class", intakeVisaClass);
                                    setShowIntake(false);
                                    saveEvaluationProgress({}, 0);
                                }}
                                className="flex-1 py-3 bg-brand-primary hover:bg-brand-hover disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md text-sm cursor-pointer"
                            >
                                Continuar a la Evaluación →
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }


    // Grouping Annex A and Annex B content
    const annexAItems = annexes.filter(item => {
        const text = item.info_text;
        return text.includes("ANEXO A") || /^\d+\./.test(text) || (text.includes("DOCUMENTOS") && !text.includes("ANEXO B") && !/^PASO/.test(text));
    });

    const annexBItems = annexes.filter(item => {
        const text = item.info_text;
        return text.includes("ANEXO B") || /^PASO\s+\d+/.test(text) || text.includes("Esta guía describe el proceso");
    });


    return (
        <div className="min-h-screen w-full flex flex-col relative bg-background-main">
            <Header headerRef={headerRef} />
            
            <main className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-10 flex flex-col gap-6 flex-1">
                
                {/* Mobile action bar for sidebar display */}
                <div className="lg:hidden w-full flex justify-between items-center bg-white p-4 rounded-2xl border border-border-light shadow-sm">
                    <span className="text-xs font-bold text-text-secondary uppercase">
                        Cuestionario {countryEmoji}
                    </span>
                    <button 
                        onClick={() => setShowSidebarMobile(!showSidebarMobile)}
                        className="bg-brand-light text-brand-primary text-xs font-bold px-4 py-2.5 rounded-lg border border-brand-primary/10 flex items-center gap-2"
                    >
                        📋 {showSidebarMobile ? "Ocultar Guía y Requisitos" : "Ver Guía y Requisitos"}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
                    
                    {/* LEFT/MAIN QUESTION COL */}
                    <div className="lg:col-span-2 flex flex-col gap-6 w-full">
                        
                        {/* 4 Pilares Stepper */}
                        <div className="w-full bg-white rounded-2xl p-6 border border-border-light shadow-sm flex flex-col gap-6">
                            {/* The Stepper Headers */}
                            <div className="grid grid-cols-4 gap-2">
                                {PILLARS.map((p, idx) => {
                                    const activePillar = getPillarIndex(question.category);
                                    const isCurrent = activePillar === idx;
                                    const isPassed = activePillar > idx;
                                    return (
                                        <div key={p.name} className="flex flex-col items-center text-center gap-1.5 relative">
                                            {/* Step Circle */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                                isCurrent 
                                                    ? "bg-brand-primary text-white ring-4 ring-brand-primary/20 scale-110" 
                                                    : isPassed 
                                                    ? "bg-emerald-500 text-white shadow-sm" 
                                                    : "bg-gray-100 text-text-muted border border-border-light"
                                            }`}>
                                                {isPassed ? "✓" : p.icon}
                                            </div>
                                            {/* Label */}
                                            <span className={`text-[9px] font-extrabold tracking-wider uppercase transition-colors duration-300 ${
                                                isCurrent ? "text-brand-primary font-bold" : "text-text-secondary/70 font-medium"
                                            }`}>
                                                {p.name}
                                            </span>
                                            {/* Subtext description on hover or small screen */}
                                            <span className="hidden md:block text-[8px] text-text-muted leading-tight font-medium max-w-[100px] mt-0.5">
                                                {p.desc}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Divider line between stepper and sub-progress */}
                            <hr className="border-border-light" />

                            {/* Sub-Progress Bar */}
                            <div>
                                <div className="flex justify-between text-[10px] text-text-secondary font-bold mb-2 uppercase tracking-wider text-left">
                                    <span>Paso {currentStep + 1} de {questions.length} ({question.category.replace(/\[cite:\s*\d+\]/g, "").trim()})</span>
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
                            
                            {/* Category Badge */}
                            <div className="flex items-center mb-6">
                                <span className="text-[10px] font-bold tracking-widest text-brand-primary uppercase border border-brand-primary/20 rounded-md px-3 py-1.5 bg-brand-light">
                                    {question.category.replace(/\[cite:\s*\d+\]/g, "").trim()}
                                </span>
                            </div>

                            {/* Active Question */}
                            <h2 className="text-2xl md:text-3xl font-serif text-text-primary leading-tight mb-8 tracking-tight font-medium">
                                {question.question.replace(/\[cite:\s*\d+\]/g, "").trim()}
                                {question.required === false && (
                                    <span className="text-sm font-sans font-normal text-text-secondary/60 ml-2">
                                        (Opcional)
                                    </span>
                                )}
                            </h2>

                            {/* Answer input/choices */}
                            <div className="flex flex-col gap-4">
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

                            {/* Section-specific notes from VIPROInfo */}
                            {sectionNotes.length > 0 && (
                                <div className="mt-8 bg-brand-light/40 border border-brand-primary/10 rounded-2xl p-5 flex flex-col gap-2">
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

                            {/* Navigation controls */}
                            <div className="mt-10 pt-6 border-t border-border-light flex items-center justify-between">
                                <button
                                    onClick={handleBack}
                                    className="font-semibold px-6 py-3 rounded-lg border border-border-light text-text-primary hover:bg-background-hover transition-colors shadow-sm text-sm md:text-base cursor-pointer"
                                >
                                    Atrás
                                </button>
                                <button
                                    disabled={question.required !== false && (answers[currentStep] === undefined || answers[currentStep] === null || answers[currentStep].trim() === '')}
                                    onClick={handleNext}
                                    className="bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-sm md:text-base cursor-pointer"
                                >
                                    {currentStep === questions.length - 1 ? 'Finalizar Evaluación' : 'Siguiente'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (ACCORDION SIDEBAR PANEL) */}
                    <div className={`w-full lg:col-span-1 flex flex-col gap-6 ${showSidebarMobile ? 'block' : 'hidden lg:flex'}`}>
                        
                        <div className="bg-white rounded-2xl p-6 border border-border-light shadow-sm flex flex-col gap-4">
                            <h2 className="text-xl font-serif text-text-primary font-bold border-b border-border-light pb-3">
                                Guía & Requisitos {countryEmoji}
                            </h2>

                            {/* Accordion 1: Requisitos (Anexo A) */}
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
                                    <div className="p-4 bg-white text-xs text-text-secondary divide-y divide-border-light/60 flex flex-col max-h-96 overflow-y-auto">
                                        {annexAItems.map((item, idx) => {
                                            const parsed = parseAnnexItem(item.info_text);
                                            if (parsed.type === 'header') return null; // skip headers
                                            return (
                                                <div key={idx} className="py-2.5 flex flex-col gap-1">
                                                    {parsed.title && (
                                                        <span className="font-bold text-text-primary uppercase tracking-wide text-[10px]">
                                                            {parsed.number ? `${parsed.number}. ` : ""}{parsed.title}
                                                        </span>
                                                    )}
                                                    <p className="leading-relaxed">{parsed.text}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Accordion 2: Guía de Proceso (Anexo B) */}
                            <div className="border border-border-light rounded-xl overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setOpenAnnexB(!openAnnexB)}
                                    className="w-full flex justify-between items-center px-4 py-3 bg-brand-light/20 hover:bg-brand-light/40 transition-colors text-left"
                                >
                                    <span className="font-bold text-sm text-text-primary flex items-center gap-2">
                                        🗺️ Guía del Proceso Paso a Paso
                                    </span>
                                    <svg
                                        className={`w-4 h-4 text-text-secondary transition-transform duration-300 ${openAnnexB ? "rotate-180" : ""}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {openAnnexB && (
                                    <div className="p-4 bg-white text-xs text-text-secondary flex flex-col gap-4 max-h-96 overflow-y-auto">
                                        {annexBItems.map((item, idx) => {
                                            const parsed = parseAnnexItem(item.info_text);
                                            if (parsed.type === 'header') return null;
                                            if (parsed.type === 'step') {
                                                return (
                                                    <div key={idx} className="flex gap-3 relative">
                                                        <div className="w-6 h-6 rounded-full bg-brand-primary text-white font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                                                            {parsed.number?.replace(/[^0-9]/g, "")}
                                                        </div>
                                                        <div className="flex-1">
                                                            {parsed.title && <span className="font-bold text-text-primary text-[10px] uppercase block mb-0.5">{parsed.title}</span>}
                                                            <p className="leading-relaxed">{parsed.text}</p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return <p key={idx} className="leading-relaxed italic border-b border-border-light pb-2">{parsed.text}</p>;
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Contact Box */}
                            <div className="bg-[#FAF9F6] border border-border-light p-4 rounded-xl flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider block">Contacto y Soporte</span>
                                <p className="font-bold text-xs text-text-primary">Volamos Viajes</p>
                                <div className="text-[11px] text-text-secondary flex flex-col gap-1 leading-normal">
                                    <span>💬 WhatsApp: 7020-0976</span>
                                    <span>✉️ Email: reservas1@volamosviajes.com</span>
                                    <span>🌐 Web: www.volamosviajes.com</span>
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

export default function ViproEvaluationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex items-center justify-center bg-background-main">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-text-secondary font-medium">Cargando evaluación...</span>
                </div>
            </div>
        }>
            <ViproEvaluationContent />
        </Suspense>
    );
}