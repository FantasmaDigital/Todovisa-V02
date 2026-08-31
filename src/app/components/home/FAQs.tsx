"use client";

import { faqs } from "@/app/constants/faqs";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { getSystemConfig } from "@/app/constants/config";

export const FAQs = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [price, setPrice] = useState(() => getSystemConfig().fullServicePrice);

    useEffect(() => {
        setPrice(getSystemConfig().fullServicePrice);

        const handleStorage = () => {
            setPrice(getSystemConfig().fullServicePrice);
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const discountPrice = price * 0.75;
    const formattedPrice = price.toLocaleString('en-US');
    const formattedDiscount = discountPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    return (
        <section className="py-16 md:py-24 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="border border-brand-primary/40 text-brand-primary font-semibold text-[11px] px-4 py-1.5 rounded-full tracking-wider uppercase mb-6 bg-brand-light/30 shadow-xs"
            >
                Preguntas Frecuentes
            </motion.div>
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-text-primary mb-12 tracking-tight leading-tight font-serif italic"
            >
                ¿Tienes preguntas? Nos encargamos.
            </motion.h2>

            <div className="w-full bg-[#EFF6FF] rounded-2xl border border-border-light/50 shadow-md overflow-hidden">
                {faqs.map((faq, index) => {
                    const isOpen = openFaq === index;
                    const isLast = index === faqs.length - 1;
                    
                    const questionText = faq.question.includes("Asesoría Consular Completa ($150 USD / $112.50 USD con VIPRO)")
                        ? faq.question.replace("Asesoría Consular Completa ($150 USD / $112.50 USD con VIPRO)", `Asesoría Consular Completa ($${formattedPrice} USD / $${formattedDiscount} USD con VIPRO)`)
                        : faq.question;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                            className={`${!isLast ? 'border-b border-[#D8E6F5]' : ''} text-left`}
                        >
                            <button
                                onClick={() => setOpenFaq(isOpen ? null : index)}
                                className="w-full px-8 py-6 flex items-center justify-between font-semibold text-text-primary text-base md:text-lg hover:bg-brand-light/50 transition-colors focus:outline-none focus:ring-0 shadow-none cursor-pointer group"
                            >
                                <span className="pr-4 group-hover:text-brand-primary transition-colors">{questionText}</span>
                                <motion.div
                                    animate={{ rotate: isOpen ? 45 : 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className={`w-8 h-8 rounded-full bg-white border border-brand-primary/20 flex items-center justify-center shrink-0 shadow-xs ${isOpen ? 'bg-brand-primary text-white border-brand-primary' : 'group-hover:border-brand-primary/50'}`}
                                >
                                    <svg className={`w-4 h-4 transition-colors ${isOpen ? 'text-white' : 'text-brand-primary'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </motion.div>
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-8 pb-6 text-sm md:text-base text-text-secondary leading-relaxed antialiased">
                                            <div className="w-8 h-[2px] bg-brand-primary/40 mb-4 rounded-full" />
                                            <p>{faq.answer}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex flex-row gap-4 mt-12 flex-wrap justify-center"
            >
                <motion.a
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    href="/vipro-form"
                    className="bg-brand-primary text-white hover:bg-brand-hover font-bold px-8 py-3.5 rounded-lg text-sm transition-all duration-200 shadow-md border-none focus:outline-none cursor-pointer"
                >
                    Evaluación VIPRO →
                </motion.a>
                <motion.a
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    href="/agents"
                    className="bg-white text-text-primary border border-border-light hover:bg-gray-50 font-bold px-8 py-3.5 rounded-lg text-sm transition-all duration-200 shadow-sm focus:outline-none cursor-pointer"
                >
                    Iniciar Proceso
                </motion.a>
            </motion.div>
        </section>
    );
};