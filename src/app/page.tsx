"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { HeroCard } from "./components/home/HeroCard";
import { ProcessSection } from "./components/home/ProcessOptions";

export default function Home() {
  // const [allData, setAllData] = useState<any>(null);
  // const [singleData, setSingleData] = useState<any>(null);
  // const [categoryData, setCategoryData] = useState<any>(null);

  // useEffect(() => {
  //   // 1. Llamada a la ruta base (obtiene todos)
  //   fetch("/api/test")
  //     .then((res) => res.json())
  //     .then((data) => setAllData(data));

  //   // 2. Llamada a la ruta dinámica por ID (ej: id 1)
  //   fetch("/api/test/1")
  //     .then((res) => res.json())
  //     .then((data) => setSingleData(data));

  //   // 3. Llamada a la ruta dinámica por Categoría (ej: id 5)
  //   fetch("/api/test/category/5")
  //     .then((res) => res.json())
  //     .then((data) => setCategoryData(data));
  // }, []);

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
      <header ref={headerRef} className="w-full overflow-hidden bg-background-main sticky top-0 z-50 flex flex-col justify-center">
        <div className="bg-brand-primary w-full m-auto sticky p-2 flex justify-center font-bold text-white text-sm underline">
          <span className="cursor-pointer">Start Your Visa Application Today!</span>
        </div>

        <div className="flex flex-col w-full py-4">
          <nav className="w-[80%] m-auto flex flex-row items-center">
            <div className="flex-shrink-0">
              <Image
                src="/images/todovisa.png"
                alt="Logo"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>

            <div className="hidden md:flex flex-row items-center gap-12 ml-12 text-sm font-semibold text-text-secondary">
              <a href="#" className="hover:text-brand-primary transition-colors duration-200">Trámites</a>
              <a href="#" className="hover:text-brand-primary transition-colors duration-200">Asesores</a>
              <a href="#" className="hover:text-brand-primary transition-colors duration-200">Precios</a>
              <a href="#" className="hover:text-brand-primary transition-colors duration-200">Recursos</a>
            </div>

            <div className="flex flex-row items-center gap-5 ml-auto">
              <button className="hidden sm:block text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">
                Iniciar Sesión
              </button>
              <button
                className="bg-brand-primary text-white font-semibold px-6 py-2 rounded-sm w-max h-min flex justify-center items-center hover:bg-brand-hover transition-colors duration-200 border-none"
              >
                Comencemos
              </button>
            </div>

          </nav>
        </div>
      </header>

      <main className="w-full">
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
        <section className="w-full bg-brand-light py-20 my-20">
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

            <button className="group flex items-center justify-center gap-2 bg-white border border-brand-primary text-brand-primary font-semibold px-8 py-3 rounded-sm hover:bg-brand-primary hover:text-white transition-all duration-300 text-sm uppercase tracking-wider shadow-sm">
              <span>Agenda una cita</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1 font-bold flex justify-center items-center">
                &rarr;
              </span>
            </button>
          </div>
        </section>

        <ProcessSection />
      </main>
    </div>
  );
}
