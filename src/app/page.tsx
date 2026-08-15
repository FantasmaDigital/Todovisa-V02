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
import { AnimatedSection } from "./components/home/AnimatedSection";
import { AgencyPromoBanner } from "./components/home/AgencyPromoBanner";

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
        <section className="w-[98%] m-auto my-8 py-4">
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedSection className="h-full" delay={0}>
              <HeroCard
                eyebrow="DIAGNÓSTICO CONSULAR"
                title="Evaluación de Viabilidad VIPRO"
                description="Evalúa tu solvencia y lazos de arraigo (EE.UU., Canadá, Australia, UK) por primera vez o renovación. Obtén un 25% de descuento directo en tu asesoría integral."
                imageSrc="/images/viproform.webp"
                linkUrl="/vipro-form"
                buttonText="Iniciar Evaluación →"
              />
            </AnimatedSection>

            <AnimatedSection className="h-full" delay={150}>
              <HeroCard
                eyebrow="PRIMERA VEZ Y RENOVACIONES"
                title="Trámites de Visado Asistidos"
                description="Gestionamos tu visa para Estados Unidos (Drop Box Waiver), México, Canadá, Australia y el Reino Unido con rigor documental y máxima efectividad."
                imageSrc="/images/estadosunidos.webp"
                linkUrl="/agents"
                buttonText="Iniciar Trámite de Visa →"
              />
            </AnimatedSection>

            <AnimatedSection className="h-full" delay={300}>
              <HeroCard
                eyebrow="RED DE ASESORES CERTIFICADOS"
                title="Acompañamiento con Asesores Expertos"
                description="Selecciona a tu agente especializado para la elaboración de tu DS-160, auditoría de expediente y simulacros intensivos de entrevista presencial por Zoom."
                imageSrc="/images/virtual-agent.webp"
                linkUrl="/agents"
                buttonText="Conocer Red de Asesores →"
              />
            </AnimatedSection>
          </div>
        </section>

        {/* Agency Promo Banner B2B */}
        <AnimatedSection>
          <AgencyPromoBanner />
        </AnimatedSection>

        {/* split image */}
        <AnimatedSection>
          <FeatureSplit refHeaderHeight={headerHeight} />
        </AnimatedSection>

        {/* process */}
        <AnimatedSection>
          <ProcessSection />
        </AnimatedSection>

        {/* testimonials */}
        <AnimatedSection>
          <Testimoniasl />
        </AnimatedSection>

        {/* agente network */}
        <AnimatedSection>
          <AgentNetwork />
        </AnimatedSection>

        {/* tu tranquilidad */}
        <AnimatedSection>
          <section className="w-full bg-gradient-to-r from-brand-light/60 via-white to-brand-light/60 py-20 border-y border-border-light/40">
            <div className="flex flex-col items-center justify-center text-center text-text-primary p-4 max-w-4xl mx-auto space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-primary bg-brand-light px-3.5 py-1 rounded-full border border-brand-primary/20">
                Compromiso TodoVisa
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-[4vw] font-serif italic font-semibold text-brand-primary leading-tight">
                Tu tranquilidad es nuestro compromiso.
              </h2>
              <h3 className="text-lg md:text-xl font-medium text-text-primary">
                Detrás de cada visa aprobada hay un expediente preparado con rigor.
              </h3>
              <p className="text-sm md:text-base text-text-secondary max-w-2xl leading-relaxed">
                Nuestros expertos transforman procesos complejos en pasos claros para que tú solo te preocupes por hacer las maletas.
              </p>
              <div className="pt-2">
                <a
                  href="/sobre-todovisa"
                  className="inline-flex items-center gap-3 bg-brand-primary hover:bg-brand-hover text-white font-bold px-8 py-3.5 rounded-lg transition-all duration-300 text-sm shadow-md cursor-pointer border-none"
                >
                  <span>Conoce sobre TodoVisa</span>
                  <span className="text-base">→</span>
                </a>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* FAQs */}
        <AnimatedSection>
          <FAQs />
        </AnimatedSection>
      </main>
      <Footer />
    </div>
  );
}
