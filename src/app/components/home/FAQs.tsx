"use client"

import { faqs } from "@/app/constants/faqs";
import { useState, useEffect } from "react";

export const FAQs = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [price, setPrice] = useState(150);

    useEffect(() => {
        const savedPrice = localStorage.getItem("fullServicePrice");
        if (savedPrice) {
            setPrice(Number(savedPrice));
        }

        const handleStorage = () => {
            const saved = localStorage.getItem("fullServicePrice");
            if (saved) {
                setPrice(Number(saved));
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const discountPrice = price * 0.75;
    const formattedPrice = price.toLocaleString('en-US');
    const formattedDiscount = discountPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    return (
        <section className="py-24 w-[90%] max-w-4xl m-auto flex flex-col items-center text-center">
            <div className="border border-brand-primary/40 text-brand-primary font-semibold text-[11px] px-4 py-1 rounded-full tracking-wider uppercase mb-8 bg-brand-light/30">
                Preguntas Frecuentes
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-text-primary mb-12 tracking-tight leading-tight font-serif italic">
                ¿Tienes preguntas? Nos encargamos.
            </h2>

            <div className="w-full bg-[#EFF6FF] rounded-2xl border border-border-light/40 shadow-xs overflow-hidden">
                {faqs.map((faq, index) => {
                    const isOpen = openFaq === index;
                    const isLast = index === faqs.length - 1;
                    
                    const questionText = faq.question.includes("Asesoría Consular Completa ($150 USD / $112.50 USD con VIPRO)")
                        ? faq.question.replace("Asesoría Consular Completa ($150 USD / $112.50 USD con VIPRO)", `Asesoría Consular Completa ($${formattedPrice} USD / $${formattedDiscount} USD con VIPRO)`)
                        : faq.question;

                    return (
                        <div
                            key={index}
                            className={`${!isLast ? 'border-b border-[#D8E6F5]' : ''} transition-all duration-300 text-left`}
                        >
                            <button
                                onClick={() => setOpenFaq(isOpen ? null : index)}
                                className="w-full px-8 py-6 flex items-center justify-between font-semibold text-text-primary text-base md:text-lg hover:bg-brand-light/40 transition-colors focus:outline-none focus:ring-0 shadow-none cursor-pointer group"
                            >
                                <span className="pr-4">{questionText}</span>
                                <div className={`w-8 h-8 rounded-full bg-white border border-brand-primary/20 flex items-center justify-center transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-45 bg-brand-primary text-white' : 'group-hover:border-brand-primary/50'}`}>
                                    <svg className={`w-4 h-4 transition-colors ${isOpen ? 'text-white' : 'text-brand-primary'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </div>
                            </button>

                            <div 
                                className={`grid transition-all duration-300 ease-in-out ${
                                    isOpen ? 'grid-rows-[1fr] opacity-100 pb-6' : 'grid-rows-[0fr] opacity-0 pb-0'
                                }`}
                            >
                                <div className="overflow-hidden px-8 text-sm md:text-base text-text-secondary leading-relaxed antialiased">
                                    <div className="w-8 h-[2px] bg-brand-primary/30 mb-4 rounded-full"></div>
                                    <p>{faq.answer}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-row gap-4 mt-12 flex-wrap justify-center">
                <a href="/vipro-form" className="bg-brand-primary text-white hover:bg-brand-hover font-bold px-8 py-3.5 rounded-lg text-sm transition-all duration-200 shadow-sm border-none focus:outline-none cursor-pointer">
                    Evaluación VIPRO
                </a>
                <a href="/agents" className="bg-white text-text-primary border border-border-light hover:bg-gray-50 font-bold px-8 py-3.5 rounded-lg text-sm transition-all duration-200 shadow-sm focus:outline-none cursor-pointer">
                    Iniciar Trámite
                </a>
            </div>
        </section>
    )
}