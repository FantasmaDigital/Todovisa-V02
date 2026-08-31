"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
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

import { useRouter } from "next/navigation";

export default function Home() {
  const headerRef = useRef(null);
  const router = useRouter();
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref") || params.get("agency_ref") || params.get("code");
      if (ref) {
        router.push(`/referral?ref=${encodeURIComponent(ref)}`);
      }
    }
  }, [router]);

  useEffect(() => {
    if (headerRef.current) {
      const height = (headerRef.current as HTMLElement).offsetHeight;
      setHeaderHeight(height);
    }
  }, []);

  return (
    <div className="w-full flex flex-col min-h-screen bg-color-text-primary overflow-x-hidden">
      <Header headerRef={headerRef} />

      <main className="w-full">
        {/* Hero home */}
        <Hero headerHeight={headerHeight} />

        {/* Cards hero section */}
        <section className="w-[98%] max-w-full m-auto my-8 py-4">
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedSection className="h-full" delay={0} variant="scale-up">
              <HeroCard
                eyebrow="DIAGNÓSTICO CONSULAR"
                title="Evaluación de Viabilidad VIPRO"
                description="Evalúa tu solvencia y lazos de arraigo (EE.UU., Canadá, Australia, UK) por primera vez o renovación. Obtén un 25% de descuento directo en tu asesoría integral."
                imageSrc="/images/viproform.webp"
                linkUrl="/vipro-form"
                buttonText="Iniciar Evaluación →"
              />
            </AnimatedSection>

            <AnimatedSection className="h-full" delay={150} variant="scale-up">
              <HeroCard
                eyebrow="CATÁLOGO DE VISAS"
                title="Requisitos y Guías por Destino"
                description="Consulta tipos de visado, tarifas consulares y requisitos específicos para Estados Unidos, Canadá, México, Reino Unido, Australia y más."
                imageSrc="/images/estadosunidos.webp"
                linkUrl="/visas"
                buttonText="Explorar Visas por País →"
              />
            </AnimatedSection>

            <AnimatedSection className="h-full" delay={300} variant="scale-up">
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
        <AnimatedSection variant="zoom-in">
          <AgencyPromoBanner />
        </AnimatedSection>

        {/* split image */}
        <AnimatedSection variant="fade-up">
          <FeatureSplit refHeaderHeight={headerHeight} />
        </AnimatedSection>

        {/* process */}
        <AnimatedSection variant="fade-up">
          <ProcessSection />
        </AnimatedSection>

        {/* testimonials */}
        <AnimatedSection variant="zoom-in">
          <Testimoniasl />
        </AnimatedSection>

        {/* agente network */}
        <AnimatedSection variant="fade-up">
          <AgentNetwork />
        </AnimatedSection>

        {/* tu tranquilidad */}
        <AnimatedSection variant="scale-up">
          <section className="w-full bg-gradient-to-r from-brand-light/60 via-white to-brand-light/60 py-24 border-y border-border-light/40 relative overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"
            />
            <div className="flex flex-col items-center justify-center text-center text-text-primary p-4 max-w-4xl mx-auto space-y-6 relative z-10">
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="text-xs font-bold uppercase tracking-widest text-brand-primary bg-brand-light px-4 py-1.5 rounded-full border border-brand-primary/20 shadow-xs"
              >
                Compromiso TodoVisa
              </motion.span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif italic font-semibold text-brand-primary leading-tight tracking-tight">
                Tu tranquilidad es nuestro compromiso.
              </h2>
              <h3 className="text-lg md:text-xl font-medium text-text-primary max-w-2xl">
                Detrás de cada visa aprobada hay un expediente preparado con rigor.
              </h3>
              <p className="text-sm md:text-base text-text-secondary max-w-2xl leading-relaxed">
                Nuestros expertos transforman procesos complejos en pasos claros para que tú solo te preocupes por hacer las maletas.
              </p>
              <div className="pt-2">
                <motion.a
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  href="/sobre-todovisa"
                  className="inline-flex items-center gap-3 bg-brand-primary hover:bg-brand-hover text-white font-bold px-8 py-4 rounded-xl transition-all text-sm shadow-lg cursor-pointer border-none"
                >
                  <span>Conoce sobre TodoVisa</span>
                  <span className="text-base">→</span>
                </motion.a>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* FAQs */}
        <AnimatedSection variant="fade-up">
          <FAQs />
        </AnimatedSection>
      </main>
      <Footer />
    </div>
  );
}
