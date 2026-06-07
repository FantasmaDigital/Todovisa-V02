"use client"

import { faqs } from "@/app/constants/faqs";
import { useState } from "react";

export const FAQs = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <section className="py-24 w-[90%] max-w-4xl m-auto flex flex-col items-center text-center">
            <div className="border border-[#0D5257] text-[#0D5257] font-semibold text-[11px] px-4 py-1 rounded-full tracking-wider uppercase mb-8 bg-transparent">
                Preguntas Frecuentes
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-[#0A2540] mb-12 tracking-tight leading-tight">
                ¿Tienes preguntas? Nos encargamos.
            </h2>

            <div className="w-full bg-[#EFF6FF] rounded-2xl border border-border-light/30 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
                {faqs.map((faq, index) => {
                    const isOpen = openFaq === index;
                    const isLast = index === faqs.length - 1;
                    return (
                        <div
                            key={index}
                            className={`${!isLast ? 'border-b border-[#D8E6F5]' : ''} transition-all duration-200 text-left`}
                        >
                            <button
                                onClick={() => setOpenFaq(isOpen ? null : index)}
                                className="w-full px-8 py-6 flex items-center justify-between font-semibold text-text-primary text-base md:text-lg hover:bg-brand-light/30 transition-colors focus:outline-none"
                            >
                                <span>{faq.question}</span>
                                <span className="text-2xl font-light text-brand-primary leading-none ml-4 select-none">
                                    {isOpen ? '−' : '+'}
                                </span>
                            </button>
                            {isOpen && (
                                <div className="px-8 pb-6 text-sm md:text-base text-text-secondary leading-relaxed antialiased">
                                    <div className="w-8 h-[2px] bg-brand-primary/30 mb-4 rounded-full"></div>
                                    <p>{faq.answer}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-row gap-4 mt-12 flex-wrap justify-center">
                <button className="bg-brand-primary text-white hover:bg-brand-hover font-bold px-8 py-3.5 rounded-lg text-sm transition-all duration-200 shadow-sm border-none focus:outline-none cursor-pointer">
                    Buscar más respuestas
                </button>
                <button className="bg-white text-text-primary border border-border-light hover:bg-gray-50 font-bold px-8 py-3.5 rounded-lg text-sm transition-all duration-200 shadow-sm focus:outline-none cursor-pointer">
                    Comenzar
                </button>
            </div>
        </section>
    )
}