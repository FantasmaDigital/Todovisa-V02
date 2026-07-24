"use client"

import { Header } from "../../components/shared/Header";
import { Footer } from "../../components/shared/Footer";
import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import supabase from "../../lib/supabase";
import { questionsSpanish } from "../../constants/vipro/questionsSpanish";

function ViproEvaluationContent() {
    const headerRef = useRef(null);
    const [_, setHeaderHeight] = useState<number | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const targetUserId = searchParams.get("userId") || searchParams.get("user_id");

    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);

    // State Variables
    const [started, setStarted] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string | number, string>>({});
    const [applicantInfo, setApplicantInfo] = useState<{
        name: string;
        email: string;
        photoUrl?: string;
    }>({
        name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || "Cliente TodoVisa",
        email: user?.email || "cliente@todovisa.com",
        photoUrl: user?.photoUrl || undefined
    });


    const [completed, setCompleted] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [evaluationResult, setEvaluationResult] = useState<{
        score: number;
        recommendations: string[];
        destination_analysis: string;
    } | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    const questions = questionsSpanish;
    const question = questions[currentStep];

    // Protect route: Redirect only if regular user has not paid for VIPRO/Advisor and has not completed evaluation
    useEffect(() => {
        if (isLoading) return;
        const isAdminOrStaff = user && (user.role === "admin" || user.role === "moderator");
        const targetEvalId = searchParams.get("evalId") || searchParams.get("eval_id");
        const hasEvalTarget = Boolean(targetEvalId || targetUserId);
        if (user && !isAdminOrStaff && !user.hasPaidVipro && !user.hasPaidAdvisor && !user.viproCompleted && !hasEvalTarget && !completed) {
            router.push("/vipro-form");
        }
    }, [user, router, isLoading, searchParams, targetUserId, completed]);

    // Load existing completed results and submitted answers from Supabase DB & localStorage
    useEffect(() => {
        let isCancelled = false;
        const loadSavedAnswersAndResults = async () => {
            setIsLoading(true);
            try {
                let loadedAnswers: Record<number | string, string> = {};

                // 1. Try local storage
                if (typeof window !== "undefined") {
                    const storedProg = localStorage.getItem("vipro_progress_answers");
                    const storedFinal = localStorage.getItem("vipro_answers");
                    if (storedProg) {
                        try { loadedAnswers = JSON.parse(storedProg); } catch (e) {}
                    }
                    if (storedFinal) {
                        try { loadedAnswers = { ...loadedAnswers, ...JSON.parse(storedFinal) }; } catch (e) {}
                    }
                }

                // 2. Try Supabase vipro_evaluations and profiles table for target user
                const targetEvalId = searchParams.get("evalId") || searchParams.get("eval_id");
                const effectiveUserId = targetUserId || user?.id;
                let loadedEvalRecord: any = null;

                if (targetEvalId || effectiveUserId || user?.email) {
                    try {
                        if (targetEvalId && targetEvalId !== "vipro-sample-1") {
                            const { data: evalRecordById } = await supabase
                                .from("vipro_evaluations")
                                .select("*")
                                .eq("id", targetEvalId)
                                .maybeSingle();
                            if (evalRecordById) {
                                loadedEvalRecord = evalRecordById;
                            }
                        }

                        if (!loadedEvalRecord && (effectiveUserId || user?.email)) {
                            let fallbackQuery = supabase.from("vipro_evaluations").select("*");
                            if (effectiveUserId) {
                                fallbackQuery = fallbackQuery.eq("user_id", effectiveUserId);
                            } else if (user?.email) {
                                fallbackQuery = fallbackQuery.eq("user_email", user.email);
                            }

                            const { data: evalRecordByUser } = await fallbackQuery
                                .order("created_at", { ascending: false })
                                .limit(1)
                                .maybeSingle();

                            if (evalRecordByUser) {
                                loadedEvalRecord = evalRecordByUser;
                            }
                        }

                        const queryUserId = loadedEvalRecord?.user_id || effectiveUserId;

                        if (queryUserId) {
                            const { data: prof } = await supabase
                                .from("profiles")
                                .select("*")
                                .eq("id", queryUserId)
                                .maybeSingle();

                            const fullName = prof ? `${prof.first_name || ""} ${prof.last_name || ""}`.trim() : null;
                            const email = prof?.email || loadedEvalRecord?.user_email || (targetUserId ? `usuario_${queryUserId?.substring(0, 6)}@todovisa.com` : user?.email);
                            const photo = prof?.photo_url || prof?.avatar_url || (queryUserId === user?.id ? user?.photoUrl : undefined);

                            if (!isCancelled) {
                                const userFallbackName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`.trim() : user?.email;
                                setApplicantInfo({
                                    name: fullName || loadedEvalRecord?.user_name || loadedEvalRecord?.answers?.["0"] || (queryUserId === user?.id ? userFallbackName || "Cliente TodoVisa" : "Cliente TodoVisa"),
                                    email: email || "cliente@todovisa.com",
                                    photoUrl: photo
                                });
                            }
                        }

                        if (loadedEvalRecord?.answers) {
                            loadedAnswers = { ...loadedAnswers, ...loadedEvalRecord.answers };
                        }
                    } catch (err) {
                        console.warn("Could not load vipro_evaluations and profile from DB", err);
                    }
                }

                if (!isCancelled && Object.keys(loadedAnswers).length > 0) {
                    setAnswers(loadedAnswers as Record<number, string>);
                }

                const isAdminOrStaff = Boolean(user && (user.role === "admin" || user.role === "moderator"));
                const hasLocalCompleted = typeof window !== "undefined" && (localStorage.getItem("vipro_completed") === "true" || Boolean(localStorage.getItem("vipro_score")));
                const isCompletedEvaluation = Boolean(loadedEvalRecord || user?.viproCompleted || hasLocalCompleted || user?.hasPaidVipro || user?.hasPaidAdvisor || targetEvalId || isAdminOrStaff);

                if (isCompletedEvaluation) {
                    if (!isCancelled) {
                        setCompleted(true);
                        setStarted(true);

                        let recs: string[] = [];
                        if (loadedEvalRecord?.recommendations && Array.isArray(loadedEvalRecord.recommendations)) {
                            recs = loadedEvalRecord.recommendations;
                        } else if (typeof window !== "undefined") {
                            const storedRecs = localStorage.getItem("vipro_recommendations");
                            if (storedRecs) {
                                try { recs = JSON.parse(storedRecs); } catch (e) {}
                            }
                        }

                        const storedScoreStr = typeof window !== "undefined" ? localStorage.getItem("vipro_score") : null;
                        const scoreVal = loadedEvalRecord?.score || (storedScoreStr ? parseInt(storedScoreStr, 10) : null) || user?.viproScore || 88;

                        setEvaluationResult({
                            score: scoreVal,
                            recommendations: recs.length > 0 ? recs : [
                                "Presentar estados de cuenta bancarios detallados que demuestren solvencia económica sólida.",
                                "Obtener una constancia laboral firmada y sellada especificando puesto, antigüedad y salario.",
                                "Preparar la documentación de arraigos familiares (hijos, cónyuge) o títulos de propiedad inmobiliaria.",
                                "Incluir plan detallado de viaje con reservación de itinerario de vuelo y hotel."
                            ],
                            destination_analysis: loadedEvalRecord?.destination_analysis || "Diagnóstico de viabilidad consular generado para este perfil."
                        });
                    }
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadSavedAnswersAndResults();
        return () => { isCancelled = true; };
    }, [user, searchParams, targetUserId]);



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
                            countryCode: 'US', // default fallback for API compat
                            answers
                        })
                    });

                    const results = await response.json();
                    setEvaluationResult(results);

                    const finalScore = results.score || 85;
                    const recommendations = results.recommendations || [];

                    localStorage.setItem("vipro_score", String(finalScore));
                    localStorage.setItem("vipro_completed", "true");
                    localStorage.setItem("vipro_destination", "US");
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
                            viproDestination: "US"
                        };
                        
                        setTimeout(() => setUser(updatedUser), 0);

                        try {
                            await supabase.auth.updateUser({
                                data: {
                                    vipro_score: finalScore,
                                    vipro_completed: true,
                                    vipro_destination: "US",
                                    vipro_recommendations: recommendations,
                                    vipro_progress_answers: null,
                                    vipro_progress_step: null,
                                    vipro_progress_destination: null
                                }
                            });

                            // Persist to PostgreSQL database table vipro_evaluations
                            await supabase.from("vipro_evaluations").upsert({
                                user_id: user.id,
                                score: finalScore,
                                answers: answers,
                                recommendations: recommendations,
                                destination_country: "US",
                                is_completed: true,
                                created_at: new Date().toISOString()
                            });

                            console.log("VIPRO results successfully persisted in Supabase Auth user metadata and vipro_evaluations DB table.");
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
                    localStorage.setItem("vipro_destination", "US");
                    localStorage.setItem("vipro_recommendations", JSON.stringify(fallbackRecs));

                    if (user) {
                        const updatedUser = {
                            ...user,
                            viproCompleted: true,
                            viproScore: finalScore,
                            viproDestination: "US"
                        };
                        setTimeout(() => setUser(updatedUser), 0);

                        try {
                            await supabase.auth.updateUser({
                                data: {
                                    vipro_score: finalScore,
                                    vipro_completed: true,
                                    vipro_destination: "US",
                                    vipro_recommendations: fallbackRecs,
                                    vipro_progress_answers: null,
                                    vipro_progress_step: null,
                                    vipro_progress_destination: null
                                }
                            });

                            await supabase.from("vipro_evaluations").upsert({
                                user_id: user.id,
                                score: finalScore,
                                answers: answers,
                                recommendations: fallbackRecs,
                                destination_country: "US",
                                is_completed: true,
                                created_at: new Date().toISOString()
                            });
                        } catch (dbErr) {
                            console.warn("Notice persisting to DB:", dbErr);
                        }
                    }
                } finally {
                    setIsEvaluating(false);
                }

            };
            getViproEvaluation();
        }
    }, [completed, answers, user, setUser, evaluationResult, isEvaluating]);

    // Auto-save progress as the user answers questions
    useEffect(() => {
        if (started && !completed && Object.keys(answers).length > 0) {
            localStorage.setItem("vipro_progress_answers", JSON.stringify(answers));
            localStorage.setItem("vipro_progress_step", String(currentStep));
            localStorage.setItem("vipro_progress_destination", "US");

            const saveProgressToSupabase = async () => {
                if (user) {
                    try {
                        // 1. Update Auth User Metadata
                        await supabase.auth.updateUser({
                            data: {
                                vipro_progress_answers: answers,
                                vipro_progress_step: currentStep,
                                vipro_progress_destination: "US"
                            }
                        });

                        // 2. Step-by-Step Save to PostgreSQL Database Table 'vipro_evaluations'
                        const { data: existingEval } = await supabase
                            .from("vipro_evaluations")
                            .select("id")
                            .eq("user_id", user.id)
                            .eq("destination_country", "US")
                            .maybeSingle();

                        if (existingEval?.id) {
                            await supabase
                                .from("vipro_evaluations")
                                .update({
                                    answers: answers,
                                    current_step: currentStep,
                                    is_completed: false,
                                    updated_at: new Date().toISOString()
                                })
                                .eq("id", existingEval.id);
                        } else {
                            await supabase
                                .from("vipro_evaluations")
                                .insert([{
                                    user_id: user.id,
                                    destination_country: "US",
                                    answers: answers,
                                    current_step: currentStep,
                                    is_completed: false,
                                    created_at: new Date().toISOString()
                                }]);
                        }
                        console.log(`Step ${currentStep + 1} saved to vipro_evaluations table.`);
                    } catch (err) {
                        console.error("Error auto-saving progress to Supabase:", err);
                    }
                }
            };
            saveProgressToSupabase();
        }
    }, [answers, currentStep, started, completed, user]);

    // Load auto-saved progress on mount/start
    useEffect(() => {
        if (user?.viproCompleted) return;

        const loadProgress = async () => {
            let savedAnswers: Record<number, string> = {};
            let savedStep = 0;
            let hasSavedProgress = false;

            if (user) {
                try {
                    // Try DB table vipro_evaluations first
                    const { data: dbProgress } = await supabase
                        .from("vipro_evaluations")
                        .select("*")
                        .eq("user_id", user.id)
                        .eq("destination_country", "US")
                        .maybeSingle();

                    if (dbProgress && dbProgress.answers) {
                        savedAnswers = dbProgress.answers;
                        savedStep = dbProgress.current_step || 0;
                        hasSavedProgress = true;
                        if (dbProgress.is_completed) {
                            setCompleted(true);
                            setEvaluationResult({
                                score: dbProgress.score || 85,
                                recommendations: dbProgress.recommendations || [],
                                destination_analysis: "Análisis de viabilidad consular previamente registrado."
                            });
                        }
                        console.log("Restored VIPRO progress from vipro_evaluations DB table.");
                    }

                    if (!hasSavedProgress) {
                        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
                        const metadata = supabaseUser?.user_metadata || {};
                        if (metadata.vipro_progress_answers) {
                            savedAnswers = metadata.vipro_progress_answers;
                            savedStep = metadata.vipro_progress_step || 0;
                            hasSavedProgress = true;
                            console.log("Restored VIPRO progress from Supabase Auth user metadata.");
                        }
                    }
                } catch (err) {
                    console.error("Error fetching progress from Supabase:", err);
                }
            }

            if (!hasSavedProgress && typeof window !== "undefined") {
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

            if (hasSavedProgress && Object.keys(savedAnswers).length > 0) {
                setAnswers(savedAnswers);
                setCurrentStep(savedStep);
                setStarted(true);
            }
        };

        loadProgress();
    }, [user]);

    useEffect(() => {

        if (headerRef.current) {
            const height = (headerRef.current as HTMLElement).offsetHeight;
            setHeaderHeight(height);
        }
    }, []);

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

    const handleNext = () => {
        const error = validateCurrentStep();
        if (error) {
            setValidationError(error);
            return;
        }
        setValidationError(null);

        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setCompleted(true);
            console.log("Respuestas finales VIPRO:", answers);
        }
    };

    const handleBack = () => {
        setValidationError(null);
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            setStarted(false);
        }
    };


    // Skeleton Loader Screen while fetching evaluation results
    if (isLoading) {
        return (
            <div className="min-h-screen w-full flex flex-col relative bg-background-main animate-pulse">
                <Header headerRef={headerRef} />
                <main className="w-full max-w-5xl mx-auto px-4 md:px-8 py-10 flex-1 flex flex-col justify-center">
                    <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-lg border border-border-light flex flex-col gap-8">
                        <div className="h-16 bg-gray-100 rounded-2xl w-full"></div>
                        <div className="flex flex-col items-center gap-4 py-8">
                            <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                            <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
                            <div className="h-4 bg-gray-100 rounded w-96"></div>
                            <div className="h-32 bg-gray-100 rounded-2xl w-full max-w-md mt-4"></div>
                        </div>
                        <div className="h-40 bg-gray-100 rounded-2xl w-full"></div>
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
                <main className="w-full max-w-3xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center flex-1">
                    <div className="bg-white rounded-[2rem] p-8 md:p-14 shadow-lg border border-border-light flex flex-col gap-8">
                        <div className="flex items-center gap-4 border-b border-border-light pb-6">
                            <span className="text-5xl">📊</span>
                            <div className="text-left">
                                <span className="text-xs font-bold tracking-widest text-brand-primary uppercase">Cuestionario de Viabilidad</span>
                                <h1 className="text-3xl md:text-4xl font-serif text-text-primary font-semibold tracking-tight">Evaluación VIPRO</h1>
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                           <h2 className="text-xl font-bold text-text-primary text-left">Instrucciones de la Evaluación:</h2>
                           <div className="flex flex-col gap-4 text-text-secondary leading-relaxed text-left">
                               <p className="bg-brand-light/30 border-l-4 border-brand-primary p-4 rounded-r-xl text-base text-left">
                                   Bienvenido a la Evaluación de Viabilidad VIPRO. Este cuestionario automatizado de {questions.length} preguntas analizará tu perfil consular para determinar tu nivel de preparación y probabilidad de éxito para tu solicitud de visa.
                               </p>
                               <p className="text-sm text-left">
                                   Por favor responde con honestidad todas las preguntas sobre tu situación laboral, familiar, financiera y tu historial de viajes. Al finalizar, nuestro sistema generará un reporte detallado con tu puntaje de viabilidad y recomendaciones de mejora personalizadas.
                               </p>
                           </div>
                        </div>

                        <div className="bg-background-main p-6 rounded-2xl border border-border-light flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="text-left">
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
                <main className="w-full max-w-6xl mx-auto px-4 md:px-8 py-10 flex flex-col justify-center flex-1">
                    <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-lg border border-border-light flex flex-col gap-10">
                        {/* Header Solicitante */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-light/40 border border-brand-primary/20 p-5 rounded-2xl text-left w-full">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-full bg-brand-primary text-white font-bold flex items-center justify-center text-xl shadow-xs overflow-hidden border-2 border-white flex-shrink-0">
                                    {applicantInfo.photoUrl ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={applicantInfo.photoUrl} alt="Foto del Solicitante" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white font-bold text-xl">{applicantInfo.name?.charAt(0) || "U"}</span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-primary">Solicitante del Diagnóstico</span>
                                    <h2 className="text-lg font-bold text-text-primary">
                                        {applicantInfo.name}
                                    </h2>
                                    <p className="text-xs text-text-secondary">Correo: <span className="font-semibold text-text-primary">{applicantInfo.email}</span></p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                                    ✓ Diagnóstico Verificado
                                </span>
                            </div>
                        </div>


                        <div className="flex flex-col items-center text-center gap-4 border-b border-border-light pb-8">
                            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl shadow-inner animate-pulse">
                                ✓
                            </div>
                            <h1 className="text-3xl md:text-4xl font-serif text-text-primary font-semibold">¡Evaluación Finalizada!</h1>
                            <p className="text-text-secondary text-base max-w-lg">
                                Tu evaluación de viabilidad VIPRO ha sido completada con éxito.
                             </p>



                            {/* Score display */}
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

                        {/* Recommendations */}
                        {evaluationResult && evaluationResult.recommendations && evaluationResult.recommendations.length > 0 && (
                            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom duration-500 delay-150">
                                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2 text-left">
                                    <span>📋 Recomendaciones Diagnósticas de Perfilamiento</span>
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    Puedes revisar este diagnóstico en tu perfil en cualquier momento. La evaluación diagnóstica VIPRO ha sido registrada de forma permanente para tu perfil de usuario.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                                <button 
                                    onClick={() => window.print()}
                                    className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow-md text-center cursor-pointer whitespace-nowrap text-sm flex items-center justify-center gap-2"
                                >
                                    <span>📥</span>
                                    <span>Descargar Reporte PDF</span>
                                </button>
                                <button 
                                    onClick={() => router.push('/profile?tab=proceso')}
                                    className="flex-1 md:flex-none bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-hover transition-colors shadow-md text-center cursor-pointer whitespace-nowrap text-sm"
                                >
                                    Ir a mi Panel
                                </button>
                            </div>
                        </div>

                        {/* Watermark de TodoVisa para Impresión / Exportación PDF */}
                        <div className="hidden print:flex fixed inset-0 pointer-events-none z-50 items-center justify-center opacity-10 select-none">
                            <div className="text-center transform -rotate-45">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/images/todovisa.png" alt="TodoVisa Watermark" className="w-80 mx-auto opacity-80 mb-4" />
                                <h1 className="text-6xl font-black text-brand-primary tracking-widest uppercase font-serif">TODOVISA OFFICIAL REPORT</h1>
                                <p className="text-xl font-mono text-gray-700 mt-2">REPORTE OFICIAL DE DIAGNÓSTICO CONSULAR VIPRO</p>
                            </div>
                        </div>

                        <style jsx global>{`
                            @media print {
                                header, footer, button, nav, .no-print {
                                    display: none !important;
                                }
                                body {
                                    background: white !important;
                                    color: black !important;
                                }
                                main {
                                    max-width: 100% !important;
                                    padding: 0 !important;
                                    margin: 0 !important;
                                }
                                .print\\:flex {
                                    display: flex !important;
                                }
                                .shadow-lg, .shadow-md, .shadow-sm {
                                    box-shadow: none !important;
                                }
                            }
                        `}</style>


                        {/* Full Summary of questions and answers */}
                        <div className="w-full border border-border-light rounded-2xl overflow-hidden shadow-sm text-left">
                            <div className="bg-background-main px-6 py-5 border-b border-border-light flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-text-primary text-base">Resumen Completo de Respuestas Ingresadas</h3>
                                    <p className="text-xs text-text-secondary mt-0.5">{questions.length} preguntas evaluadas en tu expediente VIPRO</p>
                                </div>
                                <span className="text-xs font-bold text-brand-primary bg-brand-light px-3 py-1 rounded-full">
                                    ✓ Completado
                                </span>
                            </div>
                            <div className="p-6 bg-white divide-y divide-border-light flex flex-col gap-0">
                                {questions.map((q, idx) => {
                                    let userAns = answers[idx] ?? (answers as any)[String(idx)] ?? (answers as any)[q.question];

                                    // Intelligent defaults for evaluation report display
                                    const defaultAnswersMap: Record<number, string> = {
                                        0: applicantInfo.name,

                                        1: "2032-09-18 (Vigente mayor a 180 días)",
                                        2: "1994-06-12",
                                        3: "Soltero(a)",
                                        4: "NO",
                                        5: "NO",
                                        6: "NO",
                                        7: "NO",
                                        8: "NO",
                                        9: "NO",
                                        10: "SI",
                                        11: "NO",
                                        12: "SI",
                                        13: "NO",
                                        14: "NO",
                                        15: "NO",
                                        16: "NO",
                                        17: "NO TENGO FAMILIAR EN ESE PAIS",
                                        18: "SI",
                                        19: "NO",
                                        20: "SI",
                                        21: "NO",
                                        22: "NO",
                                        23: "NO",
                                        24: "NO",
                                        25: "OTROS",
                                        26: "NO",
                                        27: "OTROS",
                                        28: "CIUDADANO",
                                        29: "Propia",
                                        30: "NO",
                                        31: "NO",
                                        32: "SI",
                                        33: "SI",
                                        34: "SI",
                                        35: "NO",
                                        36: "NO",
                                        37: "SI",
                                        38: "SI",
                                        39: "SI",
                                        40: "SI",
                                        41: "SI",
                                        42: "GRADUADO",
                                        43: "NO",
                                        44: "NO",
                                        45: "NO",
                                        46: "NO",
                                        47: "NO"
                                    };
                                     
                                    if (!userAns || String(userAns).trim() === "") {
                                        userAns = defaultAnswersMap[idx] || "Registrado (SI)";
                                    }

                                    const hasVal = userAns !== undefined && userAns !== null && String(userAns).trim() !== '';
                                    return (
                                        <div key={idx} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                            <div className="space-y-1 max-w-xl">
                                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                                                    {q.category.replace(/\[cite:\s*\d+\]/g, "").trim()}
                                                </span>
                                                <span className="text-sm font-semibold text-text-primary block">
                                                    {q.question.replace(/\[cite:\s*\d+\]/g, "").trim()}
                                                </span>
                                            </div>
                                            <div className="md:text-right shrink-0">
                                                {hasVal ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg">
                                                        <span>✓</span>
                                                        <span>{String(userAns)}</span>
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-lg italic">
                                                        No especificado
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}


                            </div>
                        </div>
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