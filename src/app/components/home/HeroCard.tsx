"use client";

import Link from "next/link";
import { motion } from "motion/react";

export const HeroCard = ({
    eyebrow,
    title,
    description,
    imageSrc,
    linkUrl = "/vipro-form",
    buttonText = "Explorar Proceso →"
}: {
    eyebrow: string;
    title: string;
    description: string;
    imageSrc: string;
    linkUrl?: string;
    buttonText?: string;
}) => {
    return (
        <motion.div
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full h-full"
        >
            <Link
                href={linkUrl}
                className="relative w-full h-[440px] rounded-2xl overflow-hidden group cursor-pointer border border-border-light/40 bg-background-surface block shadow-md hover:shadow-2xl transition-all duration-500"
            >
                <img
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    src={imageSrc}
                    alt={title}
                />

                <div className="absolute inset-0 bg-[#111827]/30 z-10 pointer-events-none group-hover:bg-[#111827]/15 transition-colors duration-500" />

                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A2F]/95 via-[#0A1A2F]/60 to-transparent h-full z-10 pointer-events-none" />

                {/* Light shimmer hover effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-15 pointer-events-none" />

                <div className="absolute inset-0 z-20 flex flex-col justify-end items-start p-8 text-left space-y-3">
                    <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/90 bg-white/15 px-3 py-1 rounded-full border border-white/20 backdrop-blur-md">
                        {eyebrow}
                    </span>

                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight font-serif group-hover:text-amber-200 transition-colors duration-300">
                        {title}
                    </h2>

                    <p className="text-xs md:text-sm font-normal text-white/90 max-w-sm leading-relaxed">
                        {description}
                    </p>

                    <div className="pt-2">
                        <span className="inline-flex items-center gap-2 text-xs font-bold text-white bg-white/20 group-hover:bg-brand-primary group-hover:shadow-lg px-4 py-2.5 rounded-lg border border-white/30 transition-all duration-300">
                            {buttonText}
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};