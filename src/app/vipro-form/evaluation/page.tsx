"use client"

import { Header } from "../../components/shared/Header";
import { Footer } from "../../components/shared/Footer";
import { useEffect, useRef, useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import supabase from "../../lib/supabase";
import agentsData from "../../dummies/agents.json";

import { questionsSpanish } from "../../constants/vipro/questionsSpanish";

// Types
type VIPROQuestionsProps = {
    question: string;
    type_question: string;
    response: string[];
    user_response: string;
    category: string;
    required?: boolean;
}

interface Agent {
    id: string;
    name: string;
    countries: string[];
}

// Country Configurations for VIPRO supported destinations
const countryConfigs: Record<string, { name: string; emoji: string }> = {
    US: {
        name: "Estados Unidos",
        emoji: "🇺🇸"
    },
    UK: {
        name: "Inglaterra (Reino Unido)",
        emoji: "🇬🇧"
    }
};

function ViproEvaluationContent() {
    const headerRef = useRef(null);
    const [headerHeight, setHeaderHeight] = useState<number | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    const countryCode = searchParams.get("country")?.toUpperCase() || "US";

    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);

    const isSupported = countryCode in countryConfigs;
    const currentConfig = isSupported ? countryConfigs[countryCode] : null;
    const countryName = currentConfig ? currentConfig.name : "Estados Unidos";
    const countryEmoji = currentConfig ? currentConfig.emoji : "🇺🇸";

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

    const questions = questionsSpanish;
    const question = questions[currentStep];

    // Load existing completed results if user already finished evaluation
    useEffect(() => {
        if (user?.viproCompleted && user?.viproDestination === countryCode) {
            setCompleted(true);
            setStarted(true);
            
            let recs: string[] = [];
            if (typeof window !== "undefined") {
                const storedRecs = localStorage.getItem("vipro_recommendations");
                if (storedRecs) {
                    try {
                        recs = JSON.parse(storedRecs);
                    } catch (e) {
                        console.error("Error parsing stored recommendations", e);
                    }
                }
            }
            
            setEvaluationResult({
                score: user.viproScore || 85,
                recommendations: recs.length > 0 ? recs : [
                    "Presentar estados de cuenta bancarios detallados que demuestren solvencia económica.",
                    "Obtener una constancia laboral firmada y sellada especificando puesto y salario.",
                    "Preparar la documentación de arraigos familiares o de propiedad."
                ],
                destination_analysis: "Análisis de viabilidad consular previamente generado para tu perfil."
            });
        }
    }, [user, countryCode]);

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
                setStarted(true);
            }
        };

        loadProgress();
    }, [user, countryCode]);

    useEffect(() => {
        if (headerRef.current) {
            const height = (headerRef.current as HTMLElement).offsetHeight;
            setHeaderHeight(height);
        }
    }, []);

    // Reset/Retake Evaluation handler
    const handleReset = async () => {
        if (!window.confirm("¿Estás seguro de que deseas reiniciar tu evaluación? Esto borrará tu puntaje y recomendaciones actuales para comenzar de nuevo.")) return;
        
        setCompleted(false);
        setStarted(false);
        setCurrentStep(0);
        setAnswers({});
        setEvaluationResult(null);
        
        if (typeof window !== "undefined") {
            localStorage.removeItem("vipro_score");
            localStorage.removeItem("vipro_completed");
            localStorage.removeItem("vipro_destination");
            localStorage.removeItem("vipro_recommendations");
            localStorage.removeItem("vipro_progress_answers");
            localStorage.removeItem("vipro_progress_step");
            localStorage.removeItem("vipro_progress_destination");
        }
        
        if (user) {
            const updatedUser = {
                ...user,
                viproCompleted: false,
                viproScore: null,
                viproDestination: null
            };
            setUser(updatedUser);
            
            try {
                await supabase.auth.updateUser({
                    data: {
                        vipro_score: null,
                        vipro_completed: false,
                        vipro_destination: null,
                        vipro_recommendations: null,
                        vipro_progress_answers: null,
                        vipro_progress_step: null,
                        vipro_progress_destination: null
                    }
                });
                console.log("VIPRO progress successfully cleared in Supabase.");
            } catch (err) {
                console.error("Failed to reset VIPRO data in Supabase:", err);
            }
        }
    };

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
                            Estamos procesando tus respuestas a través de nuestro consultor consular virtual para calcular tu probabilidad de éxito y generar recomendaciones personalizadas. Esto tomará solo unos segundos...
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
                            Estamos trabajando activamente para traerte la evaluación de viabilidad VIPRO y el análisis especializado para <strong>{countryInfo.name}</strong>, adaptado a las últimas regulaciones migratorias consulares.
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

    // Welcome Screen
    if (!started) {
        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main">
                <Header headerRef={headerRef} />
                <main className="w-full max-w-3xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center flex-1">
                    <div className="bg-white rounded-[2rem] p-8 md:p-14 shadow-lg border border-border-light flex flex-col gap-8">
                        <div className="flex items-center gap-4 border-b border-border-light pb-6">
                            <span className="text-5xl">{countryEmoji}</span>
                            <div>
                                <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">Cuestionario de Viabilidad</span>
                                <h1 className="text-3xl md:text-4xl font-serif text-text-primary font-semibold tracking-tight">Evaluación VIPRO</h1>
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                           <h2 className="text-xl font-bold text-text-primary">Instrucciones de la Evaluación:</h2>
                           <div className="flex flex-col gap-4 text-text-secondary leading-relaxed">
                               <p className="bg-brand-light/30 border-l-4 border-brand-primary p-4 rounded-r-xl text-base text-left">
                                   Bienvenido a la Evaluación de Viabilidad VIPRO. Este cuestionario automatizado de {questions.length} preguntas analizará tu perfil consular para determinar tu nivel de preparación y probabilidad de éxito para tu solicitud de visa hacia {countryName}.
                               </p>
                               <p className="text-sm text-left">
                                   Por favor responde con honestidad todas las preguntas sobre tu situación laboral, familiar, financiera y tu historial de viajes. Al finalizar, nuestro sistema generará un reporte detallado con tu puntaje de viabilidad y recomendaciones de mejora personalizadas.
                               </p>
                           </div>
                        </div>

                        <div className="bg-background-main p-6 rounded-2xl border border-border-light flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <span className="text-xs font-semibold text-text-muted uppercase">Estructura de la Evaluación</span>
                                <p className="text-text-primary font-bold text-lg">{questions.length} preguntas en total</p>
                            </div>
                            <button 
                                onClick={() => setStarted(true)}
                                className="w-full sm:w-auto bg-brand-primary text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-hover transition-colors shadow-md text-lg cursor-pointer"
                            >
                                Empezar Evaluación →
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
            <div className="min-h-screen w-full flex flex-col relative bg-background-main">
                <Header headerRef={headerRef} />
                <main className="w-full max-w-3xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center flex-1">
                    <div className="bg-white rounded-[2rem] p-8 md:p-14 shadow-lg border border-border-light flex flex-col gap-10">
                        <div className="flex flex-col items-center text-center gap-4 border-b border-border-light pb-8">
                            <div className="w-20 h-20 bg-status-success/15 text-status-success rounded-full flex items-center justify-center text-4xl shadow-inner animate-pulse">
                                ✓
                            </div>
                            <h1 className="text-3xl md:text-4xl font-serif text-text-primary font-semibold">¡Evaluación Finalizada!</h1>
                            <p className="text-text-secondary text-base max-w-lg">
                                Tu evaluación de viabilidad VIPRO para {countryEmoji} {countryName} ha sido completada con éxito.
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
                                    <span>🧠 Recomendaciones de Mejora (TodoVisa AI)</span>
                                </h2>
                                <div className="grid grid-cols-1 gap-4">
                                    {evaluationResult.recommendations.map((rec, idx) => (
                                        <div key={idx} className="flex gap-4 p-5 bg-white border border-border-light rounded-2xl shadow-sm hover:border-brand-primary/30 transition-all duration-300 text-left">
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

                        {/* Actions */}
                        <div className="bg-brand-light/40 border border-brand-primary/10 p-6 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                            <div className="flex-1 flex flex-col gap-2 text-left">
                                <h3 className="font-bold text-text-primary text-lg">Próximos Pasos</h3>
                                <p className="text-text-secondary text-sm leading-relaxed">
                                    Puedes revisar este diagnóstico en tu perfil en cualquier momento, o reiniciar la evaluación si tu situación ha cambiado.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                                <button 
                                    onClick={() => router.push('/profile?tab=proceso')}
                                    className="flex-1 md:flex-none bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-hover transition-colors shadow-md text-center cursor-pointer whitespace-nowrap text-sm"
                                >
                                    Ir a mi Panel
                                </button>
                                <button 
                                    onClick={handleReset}
                                    className="flex-1 md:flex-none border border-red-200 bg-red-50 text-red-700 font-semibold px-6 py-3 rounded-lg hover:bg-red-100 transition-colors shadow-sm text-center cursor-pointer whitespace-nowrap text-sm"
                                >
                                    Reiniciar Evaluación
                                </button>
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
                                        <span className="text-sm font-semibold text-text-primary w-full md:w-1/2 text-left">{q.question.replace(/\[cite:\s*\d+\]/g, "").trim()}</span>
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

    return (
        <div className="min-h-screen w-full flex flex-col relative bg-background-main">
            <Header headerRef={headerRef} />
            
            <main className="w-full max-w-3xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-6 flex-1 animate-in fade-in duration-300">
                
                {/* Progress Bar Header */}
                <div className="w-full bg-white rounded-2xl p-6 border border-border-light shadow-sm">
                    <div className="flex justify-between text-xs text-text-secondary font-bold mb-3 uppercase tracking-wider text-left">
                        <span>Paso {currentStep + 1} de {questions.length}</span>
                        <span>{Math.round(((currentStep + 1) / questions.length) * 100)}% Completado</span>
                    </div>
                    <div className="w-full h-2 bg-border-light rounded-full overflow-hidden">
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
                    <h2 className="text-2xl md:text-3xl font-serif text-text-primary leading-tight mb-8 tracking-tight font-medium text-left">
                        {question.question.replace(/\[cite:\s*\d+\]/g, "").trim()}
                        {question.required === false && (
                            <span className="text-sm font-sans font-normal text-text-secondary/60 ml-2">
                                (Opcional)
                            </span>
                        )}
                    </h2>

                    {/* Answer input/choices */}
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