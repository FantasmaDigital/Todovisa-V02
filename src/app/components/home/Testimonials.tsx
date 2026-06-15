import { testimonials } from "@/app/constants/testimonials";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export const Testimoniasl = () => {
    const [currentTestimonial, setCurrentTestimonial] = useState<number>(0);
    const [direction, setDirection] = useState<number>(1);

    const handlePrevTestimonial = () => {
        setDirection(-1);
        setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    };

    const handleNextTestimonial = () => {
        setDirection(1);
        setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
    };
    return (
        <section className="w-full bg-[#EFF5F0] py-28 mt-12 overflow-hidden">
            <div className="w-[90%] max-w-6xl mx-auto flex flex-col justify-center min-h-[320px]">

                <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                        key={currentTestimonial}
                        initial={{ opacity: 0, x: direction * 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -60 }}
                        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                        className="text-3xl md:text-5xl lg:text-6xl font-sans font-medium text-[#0D382B] leading-tight tracking-tight mb-16 antialiased"
                    >
                        &ldquo;{testimonials[currentTestimonial].quote}&rdquo;
                    </motion.p>
                </AnimatePresence>

                <div className="flex flex-row items-center justify-between w-full border-t border-[#0D382B]/10 pt-8 mt-4">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={`author-${currentTestimonial}`}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
                            className="flex flex-col text-left"
                        >
                            <span className="text-base font-bold text-[#0D382B]">{testimonials[currentTestimonial].author}</span>
                            <span className="text-sm text-[#0D382B]/70 mt-1">{testimonials[currentTestimonial].role}</span>
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex gap-4">
                        <button
                            onClick={handlePrevTestimonial}
                            className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#0D382B] hover:bg-white/90 shadow-sm transition-colors border border-border-light/20 cursor-pointer focus:outline-none"
                        >
                            <span className="text-lg leading-none">←</span>
                        </button>
                        <button
                            onClick={handleNextTestimonial}
                            className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#0D382B] hover:bg-white/90 shadow-sm transition-colors border border-border-light/20 cursor-pointer focus:outline-none"
                        >
                            <span className="text-lg leading-none">→</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}