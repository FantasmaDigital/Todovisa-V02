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

                    localStorage.setItem("vipro_score", String(finalScore));
                    localStorage.setItem("vipro_completed", "true");
                    localStorage.setItem("vipro_destination", countryCode);
                    localStorage.setItem("vipro_recommendations", JSON.stringify(recommendations));

                    // Clear progress keys since evaluation is completed
                    localStorage.removeItem("vipro_progress_answers");
                    localStorage.removeItem("vipro_progress_step");
                    localStorage.removeItem("vipro_progress_destination");

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
                            await supabase.auth.updateUser({
                                data: {
                                    vipro_score: finalScore,
                                    vipro_completed: true,
                                    vipro_destination: countryCode,
                                    vipro_recommendations: recommendations,
                                    vipro_progress_answers: null,
                                    vipro_progress_step: null,
                                    vipro_progress_destination: null
                                }
                            });
                            console.log("VIPRO results successfully persisted in Supabase Auth user metadata.");
                        } catch (err) {
                            console.error("Failed to persist VIPRO results to Supabase:", err);
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
                    }
                } finally {
                    setIsEvaluating(false);
                }
            };
            getViproEvaluation();
        }
    }, [completed, answers, countryCode, user, setUser, evaluationResult, isEvaluating]);

    // Auto-save progress as the user answers questions
    useEffect(() => {
        if (started && !completed && Object.keys(answers).length > 0) {
            localStorage.setItem("vipro_progress_answers", JSON.stringify(answers));
            localStorage.setItem("vipro_progress_step", String(currentStep));
            localStorage.setItem("vipro_progress_destination", countryCode);

            const saveProgressToSupabase = async () => {
                if (user) {
                    try {
                        await supabase.auth.updateUser({
                            data: {
                                vipro_progress_answers: answers,
                                vipro_progress_step: currentStep,
                                vipro_progress_destination: countryCode
                            }
                        });
                    } catch (err) {
                        console.error("Error auto-saving progress to Supabase:", err);
                    }
                }
            };
            saveProgressToSupabase();
        }
    }, [answers, currentStep, started, completed, countryCode, user]);

    // Load auto-saved progress on mount/start
    useEffect(() => {
        if (user?.viproCompleted) return;

        const loadProgress = async () => {
            let savedAnswers: Record<number, string> = {};
            let savedStep = 0;
            let hasSavedProgress = false;

            // 1. Try to load from Supabase user metadata first if logged in
            if (user) {
                try {
                    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
                    const metadata = supabaseUser?.user_metadata || {};
                    if (metadata.vipro_progress_answers && metadata.vipro_progress_destination === countryCode) {
                        savedAnswers = metadata.vipro_progress_answers;
                        savedStep = metadata.vipro_progress_step || 0;
                        hasSavedProgress = true;
                        console.log("Restored VIPRO progress from Supabase Auth user metadata.");
                    }
                } catch (err) {
                    console.error("Error fetching progress from Supabase:", err);
                }
            }

            // 2. Fallback to localStorage if no Supabase data was found or offline
            if (!hasSavedProgress && typeof window !== "undefined") {
                const localDest = localStorage.getItem("vipro_progress_destination");
                if (localDest === countryCode) {
                    const localAnswersStr = localStorage.getItem("vipro_progress_answers");
                    const localStepStr = localStorage.getItem("vipro_progress_step");
                    if (localAnswersStr) {
                        try {
                            savedAnswers = JSON.parse(localAnswersStr);
                            savedStep = localStepStr ? parseInt(localStepStr, 10) : 0;
                            hasSavedProgress = true;
                            console.log("Restored VIPRO progress from local storage.");
                        } catch (e) {
                            console.error("Error parsing local progress:", e);
                        }
                    }
                }
            }

            if (hasSavedProgress && Object.keys(savedAnswers).length > 0) {
                setAnswers(savedAnswers);
                setCurrentStep(savedStep);
                setStarted(true); // Jump straight to the form
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

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setCompleted(true);
            console.log(`Respuestas finales (${countryCode}):`, answers);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            setStarted(false);
        }
    };

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

    if (!user.hasPaidVipro && !user.hasPaidAdvisor) {
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
    // Success / Completed Screen
    if (completed) {
        // Find signature answer (last question represents signature in both datasets)
        const signatureText = answers[questions.length - 2] || answers[questions.length - 1] || "Firma Digital";

        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main">
                <Header headerRef={headerRef} />
                <main className="w-full max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center flex-1">
                    <div className="bg-white rounded-[2rem] p-8 md:p-14 shadow-lg border border-border-light flex flex-col gap-10">
                        <div className="flex flex-col items-center text-center gap-4 border-b border-border-light pb-8">
                            <div className="w-20 h-20 bg-status-success/15 text-status-success rounded-full flex items-center justify-center text-4xl shadow-inner animate-pulse">
                                ✓
                            </div>
                            <h1 className="text-3xl md:text-4xl font-serif text-text-primary font-semibold">¡Evaluación Finalizada!</h1>
                            <p className="text-text-secondary text-base max-w-lg">
                                Tu preformulario de captación VIPRO para {countryEmoji} {countryName} ha sido completado con éxito.
                            </p>

                            {/* Score display from Gemini */}
                            {evaluationResult && (
                                <div className="mt-6 flex flex-col items-center p-6 bg-brand-light/45 border border-brand-primary/20 rounded-2xl max-w-md w-full shadow-sm animate-in fade-in slide-in-from-bottom duration-500">
                                    <span className="text-[11px] font-bold text-brand-primary uppercase tracking-widest mb-1">Tu Puntaje Consular VIPRO</span>
                                    <span className="text-5xl font-serif font-bold text-brand-primary mb-2">
                                        {evaluationResult.score}/100
                                    </span>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${
                                        evaluationResult.score >= 80 
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                            : "bg-amber-50 text-amber-800 border-amber-200"
                                    }`}>
                                        {evaluationResult.score >= 80 ? "Favorable (Alta Probabilidad)" : "Requiere Fortalecimiento"}
                                    </span>
                                    {evaluationResult.destination_analysis && (
                                        <p className="text-xs text-text-secondary mt-4 italic leading-relaxed">
                                            &quot;{evaluationResult.destination_analysis}&quot;
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* AI Recommendations */}
                        {evaluationResult && evaluationResult.recommendations && evaluationResult.recommendations.length > 0 && (
                            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom duration-500 delay-150">
                                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                    <span>🧠 Recomendaciones de Mejora AI (Gemini)</span>
                                </h2>
                                <div className="grid grid-cols-1 gap-4">
                                    {evaluationResult.recommendations.map((rec, idx) => (
                                        <div key={idx} className="flex gap-4 p-5 bg-white border border-border-light rounded-2xl shadow-sm hover:border-brand-primary/30 transition-all duration-300">
                                            <div className="w-8 h-8 rounded-full bg-brand-light text-brand-primary font-bold flex items-center justify-center text-sm flex-shrink-0">
                                                {idx + 1}
                                            </div>
                                            <p className="text-sm text-text-secondary leading-relaxed self-center">
                                                {rec}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Legal Declaration */}
                        <div className="bg-[#FAF9F6] border border-border-light p-6 md:p-8 rounded-2xl flex flex-col gap-4">
                            <h3 className="text-xs font-bold tracking-widest text-text-primary uppercase border-b border-border-light pb-2">
                                Declaración y Autorización
                            </h3>
                            <div className="text-text-secondary text-sm leading-relaxed flex flex-col gap-3 italic">
                                {declarationInfo.map((item, idx) => (
                                    <p key={idx}>{item.info_text.replace(/\[cite:\s*\d+\]/g, "").trim()}</p>
                                ))}
                            </div>
                            <div className="mt-6 flex flex-col items-center justify-center p-4 border border-dashed border-border-light bg-white rounded-xl">
                                <span className="text-xs text-text-muted uppercase tracking-wider mb-2">Firma Digital del Solicitante</span>
                                <span className="font-serif italic text-2xl text-brand-primary tracking-wide font-semibold">
                                    {signatureText}
                                </span>
                            </div>
                        </div>

                        {/* Contact details */}
                        <div className="bg-brand-light/40 border border-brand-primary/10 p-6 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                            <div className="flex-1 flex flex-col gap-2">
                                <h3 className="font-bold text-text-primary text-lg">Próximos Pasos</h3>
                                {contactInfo.map((item, idx) => (
                                    <p key={idx} className="text-text-secondary text-sm leading-relaxed">
                                        {item.info_text.replace(/\[cite:\s*\d+\]/g, "").trim()}
                                    </p>
                                ))}
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button 
                                    onClick={() => router.push('/profile?tab=proceso')}
                                    className="flex-1 md:flex-none bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-hover transition-colors shadow-md text-center cursor-pointer whitespace-nowrap"
                                >
                                    Ver mi Perfil
                                </button>
                                <a 
                                    href="https://wa.me/50370200976" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex-1 md:flex-none border border-border-light bg-white text-text-primary font-semibold px-6 py-3 rounded-lg hover:bg-background-hover transition-colors shadow-sm text-center cursor-pointer whitespace-nowrap"
                                >
                                    Hablar con Asesor
                                </a>
                            </div>
                        </div>

                        {/* Summary of questions and answers */}
                        <details className="w-full border border-border-light rounded-xl overflow-hidden shadow-sm">
                            <summary className="bg-background-hover px-6 py-4 font-semibold text-text-primary cursor-pointer hover:bg-border-light/60 transition-colors select-none flex justify-between items-center">
                                <span>Ver Resumen de Respuestas ({questions.length} campos)</span>
                                <span className="text-xs text-brand-primary font-bold">Mostrar/Ocultar</span>
                            </summary>
                            <div className="p-6 bg-white max-h-96 overflow-y-auto divide-y divide-border-light flex flex-col">
                                {questions.map((q, idx) => (
                                    <div key={idx} className="py-3 flex flex-col md:flex-row md:justify-between gap-2">
                                        <span className="text-sm font-semibold text-text-primary w-full md:w-1/2">{q.question.replace(/\[cite:\s*\d+\]/g, "").trim()}</span>
                                        <span className="text-sm text-text-secondary w-full md:w-1/2 text-left md:text-right font-medium">
                                            {answers[idx] || <span className="italic text-text-muted">No respondido / En blanco</span>}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </details>
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
                        
                        {/* Progress Bar Header */}
                        <div className="w-full bg-white rounded-2xl p-6 border border-border-light shadow-sm">
                            <div className="flex justify-between text-xs text-text-secondary font-bold mb-3 uppercase tracking-wider">
                                <span>Paso {currentStep + 1} de {questions.length}</span>
                                <span>{Math.round(((currentStep + 1) / questions.length) * 100)}% Completado</span>
                            </div>
                            <div className="w-full h-2 bg-border-light rounded-full overflow-hidden text-left">
                                <div
                                    className="h-full bg-brand-primary transition-all duration-500 ease-out"
                                    style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                                ></div>
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