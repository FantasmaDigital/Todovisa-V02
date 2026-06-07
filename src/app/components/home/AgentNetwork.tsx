export const AgentNetwork = () => {
    return (
        <section className="w-full mx-auto flex flex-col lg:flex-row items-center gap-16">
            {/* Columna izquierda: texto — 80% centrado dentro de su mitad */}
            <div className="w-full lg:w-1/2 flex items-center justify-center">
                <div className="w-[70%] flex flex-col items-start text-left">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary mb-4">ÚNETE A LA RED</span>
                    <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">
                        ¿Quieres unirte<br />a la red de agentes virtuales?
                    </h2>
                    <p className="text-lg text-text-secondary mb-10 leading-relaxed max-w-lg font-medium">
                        Cambia la forma en la que gestionas tu práctica. Recibe clientes previamente evaluados, organiza tus expedientes en un panel centralizado y dedica tu tiempo a asegurar visas aprobadas.
                    </p>
                    <ul className="flex flex-col gap-3 mb-10">
                        {[
                            "Acceso a clientes ya evaluados y comprometidos",
                            "Panel de control digital para tus expedientes",
                            "Soporte técnico y legal de la plataforma",
                            "Comisiones competitivas y pagos puntuales",
                        ].map((item) => (
                            <li key={item} className="flex items-start gap-3 text-sm text-text-secondary">
                                <span className="mt-0.5 text-brand-primary font-bold text-base leading-none">✓</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                    <button className="bg-brand-primary text-white font-semibold px-8 py-3 rounded-sm hover:bg-[#0f3755] transition-colors text-sm border-none focus:outline-none">
                        Aplicar como experto →
                    </button>
                </div>
            </div>

            {/* Columna derecha: imagen */}
            <div className="w-full lg:w-1/2">
                <div className="relative w-full aspect-[4/5] md:aspect-square overflow-hidden shadow-sm bg-white">
                    <img
                        src="/images/network-agents.webp"
                        alt="Red de Agentes TODOVISA"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </section>
    )
}