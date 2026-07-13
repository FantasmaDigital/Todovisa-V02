"use client"

import { Header } from "../components/shared/Header";
import { Footer } from "../components/shared/Footer";
import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { CheckoutModal } from "../components/shared/CheckoutModal";
import supabase from "../lib/supabase";

function ViproFormContent() {
    const headerRef = useRef(null);
    const [_, setHeaderHeight] = useState<number | null>(null);
    const [inProgress, setInProgress] = useState<boolean>(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const router = useRouter();
    const user = useAuthStore((state) => state.user);

    // Check if there is an in-progress evaluation
    useEffect(() => {
        const checkProgress = async () => {
            let hasProgress = false;
            // Check local storage first
            if (typeof window !== "undefined") {
                const localAnswers = localStorage.getItem("vipro_progress_answers");
                if (localAnswers) {
                    try {
                        const parsed = JSON.parse(localAnswers);
                        if (Object.keys(parsed).length > 0) {
                            hasProgress = true;
                        }
                    } catch (e) {}
                }
            }

            // If not in local storage and logged in, check supabase user metadata
            if (!hasProgress && user) {
                try {
                    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
                    const metadata = supabaseUser?.user_metadata || {};
                    if (metadata.vipro_progress_answers) {
                        if (Object.keys(metadata.vipro_progress_answers).length > 0) {
                            hasProgress = true;
                        }
                    }
                } catch (err) {
                    console.error("Error checking progress in Supabase:", err);
                }
            }

            setInProgress(hasProgress);
        };

        checkProgress();
    }, [user]);

    useEffect(() => {
        if (headerRef.current) {
            const height = (headerRef.current as HTMLElement).offsetHeight;
            setHeaderHeight(height);
        }
    }, []);

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

    const hasPaid = user.hasPaidVipro || user.hasPaidAdvisor;
    const completed = user.viproCompleted;

    return (
        <div className="min-h-screen w-full flex flex-col relative bg-background-main">
            <Header headerRef={headerRef} />
            <main className="w-[80%] mx-auto py-12 md:py-20 flex flex-col gap-24 flex-1">
                <div className="flex flex-col md:flex-row items-center gap-20">
                    <div className="w-full md:w-1/2 flex flex-col items-start gap-6">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-text-primary leading-tight tracking-tight text-left">
                            Evaluación <span className="text-brand-primary font-bold">VIPRO</span>
                        </h1>

                        <p className="text-base text-text-secondary leading-relaxed text-left">
                            Nuestra Evaluación VIPRO de viabilidad analiza tu perfil consular y te brinda recomendaciones personalizadas impulsadas por IA para aumentar tus probabilidades de éxito.
                        </p>

                        {completed ? (
                            /* Already completed state (can only complete it once) */
                            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-[1.5rem] p-6 md:p-8 flex flex-col gap-5 text-left shadow-sm">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Evaluación Finalizada</span>
                                    <p className="text-lg font-serif font-semibold text-emerald-900">
                                        ¡Ya has completado tu Evaluación VIPRO!
                                    </p>
                                </div>
                                <p className="text-sm text-emerald-800/80">
                                    De acuerdo con nuestras políticas, la evaluación diagnóstica VIPRO se realiza una sola vez. Puedes consultar tu reporte de viabilidad y tus recomendaciones detalladas directamente en tu panel.
                                </p>
                                <div className="flex mt-2">
                                    <button
                                        onClick={() => router.push("/profile?tab=proceso")}
                                        className="w-full sm:w-auto bg-emerald-600 text-white font-semibold py-3 px-8 rounded-md hover:bg-emerald-700 transition-colors shadow-md text-sm cursor-pointer"
                                    >
                                        Ver Resultados en Mi Panel
                                    </button>
                                </div>
                            </div>
                        ) : !hasPaid ? (
                            /* Not paid: Display payment simulation gate */
                            <div className="w-full bg-amber-50/45 border border-amber-200/50 rounded-[1.5rem] p-6 md:p-8 flex flex-col gap-5 text-left shadow-sm">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Acceso de Pago</span>
                                    <p className="text-lg font-serif font-semibold text-amber-900">
                                        Adquiere tu Evaluación VIPRO
                                    </p>
                                </div>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    Para comenzar el cuestionario diagnóstico y recibir tu reporte automatizado con inteligencia artificial, debes completar el pago seguro de la evaluación.
                                </p>
                                <div className="flex flex-col gap-4 mt-2">
                                    <div className="flex items-end gap-3">
                                        <span className="text-4xl font-bold text-text-primary">$19.99</span>
                                        <span className="text-sm text-text-secondary mb-1">USD</span>
                                    </div>
                                    <span className="text-xs font-medium text-brand-primary bg-brand-light px-4 py-1.5 rounded-full w-max">
                                        🎉 Recibirás un 25% de descuento en tu asesoría posterior
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsCheckoutOpen(true)}
                                    className="w-full sm:w-auto bg-brand-primary text-white font-semibold py-3 px-8 rounded-md hover:bg-brand-hover transition-colors shadow-md text-sm cursor-pointer mt-2 text-center"
                                >
                                    Adquirir VIPRO Express
                                </button>
                            </div>
                        ) : inProgress ? (
                            /* Paid and in-progress state */
                            <div className="w-full bg-brand-light/45 border border-brand-primary/20 rounded-[1.5rem] p-6 md:p-8 flex flex-col gap-5 text-left shadow-sm">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">Cuestionario en Curso</span>
                                    <p className="text-lg font-serif font-semibold text-text-primary">
                                        Tienes una evaluación iniciada
                                    </p>
                                </div>
                                <p className="text-sm text-text-secondary font-sans">
                                    Puedes continuar respondiendo donde lo dejaste para recibir tu reporte de viabilidad y puntaje consular.
                                </p>
                                <div className="flex mt-2">
                                    <button
                                        onClick={() => router.push("/vipro-form/evaluation")}
                                        className="w-full sm:w-auto bg-brand-primary text-white font-semibold py-3 px-8 rounded-md hover:bg-brand-hover transition-colors shadow-md text-sm cursor-pointer"
                                    >
                                        Continuar Evaluación
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Paid but not started state */
                            <div className="w-full bg-brand-light/45 border border-brand-primary/20 rounded-[1.5rem] p-6 md:p-8 flex flex-col gap-5 text-left shadow-sm">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">Acceso Habilitado</span>
                                    <p className="text-lg font-serif font-semibold text-text-primary">
                                        Estás listo para realizar tu Evaluación
                                    </p>
                                </div>
                                <p className="text-xs text-text-secondary leading-relaxed">
                                    Ya has adquirido tu evaluación VIPRO con éxito. Comienza ahora para obtener tu diagnóstico y recomendaciones de preparación.
                                </p>
                                <div className="flex mt-2">
                                    <button
                                        onClick={() => router.push("/vipro-form/evaluation")}
                                        className="w-full sm:w-auto bg-brand-primary text-white font-semibold py-3.5 px-8 rounded-md hover:bg-brand-hover transition-colors shadow-md text-sm cursor-pointer"
                                    >
                                        Empezar Evaluación VIPRO
                                    </button>
                                </div>
                            </div>
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

            {/* Simulated Payment checkout modal */}
            {isCheckoutOpen && (
                <CheckoutModal 
                    product="vipro" 
                    onClose={() => setIsCheckoutOpen(false)} 
                    onSuccess={() => {
                        setIsCheckoutOpen(false);
                        router.push("/vipro-form/evaluation");
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