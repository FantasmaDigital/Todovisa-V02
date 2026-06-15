export const HeroCard = ({ eyebrow, title, description, imageSrc }: { eyebrow: string, title: string, description: string, imageSrc: string }) => {
    return (
        <div className="relative w-full h-full rounded-2xl overflow-hidden group cursor-pointer border border-border-light bg-background-surface">
            <img
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                src={imageSrc}
                alt={title}
            />

            <div className="absolute inset-0 bg-[#111827]/10 z-10 pointer-events-none"></div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/95 via-[#111827]/60 to-transparent h-full z-10 pointer-events-none"></div>

            <div className="absolute inset-0 z-20 flex flex-col justify-end items-start p-8 text-left">
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/90 mb-3">
                    {eyebrow}
                </span>

                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
                    {title}
                </h2>

                <p className="text-sm md:text-base font-medium text-white/90 max-w-sm">
                    {description}
                </p>
                
            </div>
        </div>
    );
};