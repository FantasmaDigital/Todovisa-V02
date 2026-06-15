"use client";

import { useEffect, useRef, useState } from "react";
import { HeroCard } from "./components/home/HeroCard";
import { ProcessSection } from "./components/home/ProcessOptions";
import { FeatureSplit } from "./components/home/FeatureSplit";
import { Footer } from "./components/shared/Footer";
import { FAQs } from "./components/home/FAQs";
import { AgentNetwork } from "./components/home/AgentNetwork";
import { Header } from "./components/shared/Header";
import { Hero } from "./components/home/Hero";
import { Testimoniasl } from "./components/home/Testimonials";

export default function Home() {
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);

  useEffect(() => {
    if (headerRef.current) {
      const height = (headerRef.current as HTMLElement).offsetHeight;
      setHeaderHeight(height);
    }
  }, []);

  return (
    <div className="w-full flex flex-col min-h-screen bg-color-text-primary">
      <Header headerRef={headerRef} />

      <main className="w-full">
        {/* Hero home */}
        <Hero headerHeight={headerHeight} />

        {/* Cards hero section */}
        <section className="h-[36.5rem] w-[98%] m-auto my-5">
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-3 gap-6">

            <HeroCard
              eyebrow="FORMULARIO VIPRO"
              title="¿Listo para tu visa?"
              description="Conoce tu preparación actual. Te guiaremos en cada paso y al completar la evaluación, recibirás un 25% de descuento en tu asesoría."
              imageSrc="/images/viproform.webp"
            />

            <HeroCard
              eyebrow="ESTADOS UNIDOS"
              title="Tu destino soñado"
              description="Haz realidad tu viaje. Gestionamos tu visado americano de turismo, estudio o trabajo con la asesoría de los mejores expertos."
              imageSrc="/images/estadosunidos.webp"
            />

            <HeroCard
              eyebrow="SOPORTE CONTINUO"
              title="Asesoría en todo momento"
              description="Tu trámite en manos seguras. Elige a tu agente ideal y cuenta con su respaldo directo para resolver cualquier duda hasta el día de tu entrevista."
              imageSrc="/images/virtual-agent.webp"
            />

          </div>
        </section>

        {/* split image */}
        <FeatureSplit refHeaderHeight={headerHeight} />

        {/* process */}
        <ProcessSection />

        {/* testimonials */}
        <Testimoniasl />

        {/* agente network */}
        <AgentNetwork />

        {/* tu tranquilidad */}
        <section className="w-full bg-brand-light py-20">
          <div className="flex flex-col items-center justify-center text-center text-text-primary p-4 max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-[5vw] font-serif italic font-medium mb-6 text-brand-primary">
              Tu tranquilidad es nuestro compromiso
            </h2>
            <h3 className="text-xl md:text-2xl font-semibold mb-2">
              Detrás de cada visa aprobada hay una historia de éxito.
            </h3>
            <p className="text-base md:text-lg text-text-secondary max-w-2xl mb-8">
              Nuestros expertos transforman procesos complejos en pasos claros para que tú solo te preocupes por hacer las maletas.
            </p>
            <button className="group flex items-center justify-center gap-2 bg-white border border-brand-primary text-brand-primary font-semibold px-8 py-3 rounded-sm hover:bg-brand-primary hover:text-white transition-all duration-300 text-sm uppercase tracking-wider shadow-sm focus:outline-none">
              <span>Agenda una cita</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1 font-bold flex justify-center items-center">
                &rarr;
              </span>
            </button>
          </div>
        </section>

        {/* FAQs */}
        <FAQs />
      </main>
      <Footer />
    </div>
  );
}
