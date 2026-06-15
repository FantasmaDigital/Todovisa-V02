"use client"

import { Header } from "../../components/shared/Header";
import { Footer } from "../../components/shared/Footer";
import { useEffect, useRef, useState } from "react";

import { VIPROQuestions } from "../../constants/vipro/data";

export default function ViproEvaluationPage() {
    const headerRef = useRef(null);
    const [_, setHeaderHeight] = useState<number | null>(null);

    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});

    const question = VIPROQuestions[currentStep];

    useEffect(() => {
        if (headerRef.current) {
            const height = (headerRef.current as HTMLElement).offsetHeight;
            setHeaderHeight(height);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < VIPROQuestions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            alert("¡Evaluación completada! Procesando resultados...");
            console.log("Respuestas finales:", answers);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col relative bg-background-main">
            <Header headerRef={headerRef} />
            <main className="w-full max-w-[1200px] mx-auto px-6 py-12 md:py-20 flex flex-col gap-10 flex-1">

                <div className="w-full max-w-3xl mx-auto">
                    <div className="flex justify-between text-xs text-text-secondary font-semibold mb-2 uppercase tracking-wide">
                        <span>Paso {currentStep + 1} de {VIPROQuestions.length}</span>
                        <span>{Math.round(((currentStep + 1) / VIPROQuestions.length) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden">
                        <div
                            className="h-full bg-brand-primary transition-all duration-500 ease-out"
                            style={{ width: `${((currentStep + 1) / VIPROQuestions.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="w-full max-w-3xl mx-auto bg-[#F9F8F6] rounded-[2rem] p-8 md:p-14 shadow-sm border border-[#EBEBEB]">
                    <div className="flex items-center mb-8">
                        <span className="text-[10px] font-bold tracking-widest text-text-primary uppercase border border-text-primary/20 rounded-md px-3 py-1.5 bg-transparent">
                            {question.category}
                        </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-serif text-text-primary leading-tight mb-12 tracking-tight">
                        {question.question}
                    </h2>

                    <div className="flex flex-col gap-4">
                        {question.type_question === "cerrada" ? (
                            question.response.map((opt, i) => (
                                <div
                                    key={i}
                                    onClick={() => setAnswers({ ...answers, [currentStep]: opt })}
                                    className={`flex items-center gap-4 p-5 rounded-xl border cursor-pointer transition-all duration-200 ${answers[currentStep] === opt
                                            ? 'border-brand-primary bg-white shadow-sm ring-1 ring-brand-primary'
                                            : 'border-border-light bg-white hover:border-brand-primary/40 hover:shadow-sm'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${answers[currentStep] === opt ? 'border-brand-primary' : 'border-gray-300'}`}>
                                        {answers[currentStep] === opt && <div className="w-2.5 h-2.5 bg-brand-primary rounded-full"></div>}
                                    </div>
                                    <span className="text-lg text-text-primary font-medium">{opt}</span>
                                </div>
                            ))
                        ) : (
                            <input
                                type={question.question.toLowerCase().includes('fecha') || question.question.toLowerCase().includes('date') ? 'date' : 'text'}
                                value={answers[currentStep] || ''}
                                onChange={(e) => setAnswers({ ...answers, [currentStep]: e.target.value })}
                                placeholder="Escribe tu respuesta aquí..."
                                className="w-full border border-border-light rounded-xl px-6 py-5 text-lg text-text-primary bg-white focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all shadow-sm"
                            />
                        )}
                    </div>

                    <div className="mt-14 flex items-center justify-between">
                        <button
                            disabled={currentStep === 0}
                            onClick={handleBack}
                            className={`font-semibold px-8 py-3.5 rounded-lg transition-colors text-base ${currentStep === 0
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-text-primary bg-white border border-border-light hover:bg-gray-50 shadow-sm'
                                }`}
                        >
                            Atrás
                        </button>
                        <button
                            disabled={!answers[currentStep] || answers[currentStep].trim() === ''}
                            onClick={handleNext}
                            className="bg-brand-primary text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-base"
                        >
                            {currentStep === VIPROQuestions.length - 1 ? 'Finalizar Evaluación' : 'Siguiente'}
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};