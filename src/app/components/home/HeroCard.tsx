import Link from "next/link";

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
        <Link
            href={linkUrl}
            className="relative w-full h-[440px] rounded-2xl overflow-hidden group cursor-pointer border border-border-light/40 bg-background-surface block shadow-md hover:shadow-2xl transition-all duration-500"
        >
            <img
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                src={imageSrc}
                alt={title}
            />

            <div className="absolute inset-0 bg-[#111827]/20 z-10 pointer-events-none group-hover:bg-[#111827]/10 transition-colors duration-500"></div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A2F]/95 via-[#0A1A2F]/65 to-transparent h-full z-10 pointer-events-none"></div>

            <div className="absolute inset-0 z-20 flex flex-col justify-end items-start p-8 text-left space-y-3">
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/80 bg-white/10 px-3 py-1 rounded-full border border-white/20 backdrop-blur-xs">
                    {eyebrow}
                </span>

                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight font-serif">
                    {title}
                </h2>

                <p className="text-xs md:text-sm font-normal text-white/90 max-w-sm leading-relaxed">
                    {description}
                </p>

                <div className="pt-2">
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-white bg-white/20 group-hover:bg-brand-primary px-4 py-2 rounded-lg border border-white/30 transition-all duration-300">
                        {buttonText}
                    </span>
                </div>
            </div>
        </Link>
    );
};