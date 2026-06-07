export const Hero = ({ headerHeight }: { headerHeight: number | null }) => {
    return (
        <div
            className="relative w-[98%] m-auto rounded-xl overflow-hidden bg-background-main"
            style={{
                height: `calc(98dvh - ${headerHeight}px)`,
                minHeight: '600px'
            }}
        >
            <img
                src="/images/backgrounds/canada.webp"
                alt="Fondo de destino Canadá"
                className="absolute inset-0 w-full h-full object-cover object-center"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#111827]/10 to-[#111827]/80 z-0"></div>

            <section className="absolute inset-0 z-10 flex flex-col justify-end items-center text-center px-6 pb-24 w-full max-w-4xl mx-auto">

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
                    Tu visa sin estrés, guiada por expertos y tecnología.
                </h1>

                <p className="text-base md:text-lg text-white/80 mb-10 max-w-2xl font-medium">
                    Completa nuestra evaluación en minutos y te conectaremos con el asesor ideal para tu viaje.
                </p>

                <div className="w-full max-w-lg bg-background-surface rounded-sm p-1.5 flex flex-col sm:flex-row border border-border-light transition-all focus-within:border-border-focus">
                    <input
                        type="text"
                        placeholder="¿A qué país deseas viajar?"
                        className="flex-1 bg-transparent px-4 py-3 text-text-primary placeholder:text-text-muted outline-none text-sm"
                    />
                    <button className="mt-2 sm:mt-0 bg-brand-primary text-white font-semibold px-8 py-3 rounded-sm hover:bg-brand-hover transition-colors text-sm">
                        Comenzar
                    </button>
                </div>

            </section>
        </div>
    )
}