"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const DESTINATIONS = [
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", tag: "B1/B2 · F1 · H1B" },
  { code: "CA", name: "Canadá", flag: "🇨🇦", tag: "Visitante · Estudios · Trabajo" },
  { code: "UK", name: "Reino Unido", flag: "🇬🇧", tag: "Estándar · Estudiante · Skilled Worker" },
  { code: "ES", name: "España", flag: "🇪🇸", tag: "Schengen · Larga Estancia" },
  { code: "DE", name: "Alemania", flag: "🇩🇪", tag: "Schengen · Trabajo Cualificado" },
  { code: "IT", name: "Italia", flag: "🇮🇹", tag: "Schengen · Reagrupación Familiar" },
  { code: "FR", name: "Francia", flag: "🇫🇷", tag: "Schengen · Estudios" },
  { code: "AU", name: "Australia", flag: "🇦🇺", tag: "Turista · Working Holiday" },
  { code: "MX", name: "México", flag: "🇲🇽", tag: "Sin visa para muchos países" },
  { code: "NL", name: "Países Bajos", flag: "🇳🇱", tag: "Schengen · Orientación de Empleo" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", tag: "Schengen · Nómada Digital" },
  { code: "CH", name: "Suiza", flag: "🇨🇭", tag: "Schengen · Alta Cualificación" },
  { code: "JP", name: "Japón", flag: "🇯🇵", tag: "Turismo · Trabajo Especificado" },
  { code: "KR", name: "Corea del Sur", flag: "🇰🇷", tag: "Turismo · Estudiante" },
  { code: "SG", name: "Singapur", flag: "🇸🇬", tag: "Trabajo · Emprendedor" },
  { code: "NZ", name: "Nueva Zelanda", flag: "🇳🇿", tag: "Visitante · Working Holiday" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", tag: "Turismo" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", tag: "Turismo" },
  { code: "AE", name: "Emiratos Árabes", flag: "🇦🇪", tag: "Turismo · Trabajo" },
];

const POPULAR = ["US", "CA", "UK", "ES", "AU"];

export const Hero = ({ headerHeight }: { headerHeight: number | null }) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [selected, setSelected] = useState<(typeof DESTINATIONS)[0] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? DESTINATIONS.filter(
        (d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.code.toLowerCase().includes(query.toLowerCase()) ||
          d.tag.toLowerCase().includes(query.toLowerCase())
      )
    : DESTINATIONS.filter((d) => POPULAR.includes(d.code));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (dest: (typeof DESTINATIONS)[0]) => {
    setSelected(dest);
    setQuery(dest.name);
    setOpen(false);
    setHighlighted(-1);
  };

  const go = () => {
    const target = selected || filtered[0];
    if (target) router.push(`/vipro-form?country=${target.code}`);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (highlighted >= 0 && filtered[highlighted]) {
        pick(filtered[highlighted]);
      } else {
        go();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      className="relative w-[98%] m-auto rounded-xl bg-background-main"
      style={{ height: `calc(98dvh - ${headerHeight}px)`, minHeight: "600px" }}
    >
      {/* Background — clipped to rounded corners, pointer-events off so overlay doesn't block */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none select-none">
        <img
          src="/images/backgrounds/canada.webp"
          alt="Fondo de destino Canadá"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#111827]/10 to-[#111827]/80" />
      </div>

      {/* Content layer — overflow visible so dropdown is never clipped */}
      <section
        className="absolute inset-0 flex flex-col justify-end items-center text-center px-6 pb-24 w-full max-w-4xl mx-auto"
        style={{ zIndex: 10, overflow: "visible" }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight">
          Tu visa sin estrés, guiada por expertos y tecnología.
        </h1>
        <p className="text-base md:text-lg text-white/80 mb-10 max-w-2xl font-medium">
          Completa nuestra evaluación en minutos y te conectaremos con el asesor ideal para tu viaje.
        </p>

        {/* Search wrapper — absolutely positioned above everything */}
        <div className="relative w-full max-w-xl" style={{ zIndex: 9999 }}>

          {/* Input bar */}
          <div className="flex items-center bg-white rounded-sm shadow-2xl">
            <span className="pl-4 text-xl select-none flex-shrink-0">
              {selected ? selected.flag : "🌍"}
            </span>

            <input
              ref={inputRef}
              type="text"
              value={query}
              placeholder="¿A qué país deseas viajar?"
              style={{ outline: "none", boxShadow: "none" }}
              className="flex-1 bg-transparent px-4 py-3.5 text-gray-800 placeholder-gray-400 text-sm border-0"
              onFocus={() => { setOpen(true); setHighlighted(-1); }}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
                setOpen(true);
                setHighlighted(-1);
              }}
              onKeyDown={onKey}
            />

            {query && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery("");
                  setSelected(null);
                  inputRef.current?.focus();
                }}
                className="px-2 text-gray-400 hover:text-gray-700 text-base flex-shrink-0 cursor-pointer"
              >
                ✕
              </button>
            )}

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); go(); }}
              className="m-1 flex-shrink-0 bg-brand-primary hover:bg-brand-hover text-white font-semibold px-7 py-3 rounded-sm transition-colors text-sm whitespace-nowrap cursor-pointer"
            >
              Comenzar →
            </button>
          </div>

          {/* Dropdown — fully opaque, scroll contained inside the <ul> */}
          {open && (
            <div
              ref={dropRef}
              className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white rounded-sm border border-gray-200 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150"
              style={{ zIndex: 9999 }}
            >
              {filtered.length > 0 ? (
                <>
                  {!query.trim() && (
                    <div className="px-4 pt-3 pb-1.5 border-b border-gray-100">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Destinos Populares
                      </span>
                    </div>
                  )}

                  {/* Scroll container — fixed height, overflow-y scroll */}
                  <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                    {filtered.map((dest, i) => (
                      <button
                        key={dest.code}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); pick(dest); }}
                        onMouseEnter={() => setHighlighted(i)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-gray-100 last:border-0"
                        style={{
                          backgroundColor: highlighted === i ? "#f0f4ff" : "#ffffff",
                        }}
                      >
                        <span className="text-xl flex-shrink-0">{dest.flag}</span>
                        <div className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-gray-800 leading-snug">
                            {dest.name}
                          </span>
                          <span className="block text-[11px] text-gray-400 leading-snug truncate">
                            {dest.tag}
                          </span>
                        </div>
                        <span className="flex-shrink-0 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm">
                          {dest.code}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                      ↑↓ navegar &nbsp;·&nbsp; Enter para ir
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold">
                      {filtered.length} destino{filtered.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </>
              ) : (
                <div className="px-5 py-5 text-center">
                  <span className="text-2xl block mb-1">🔍</span>
                  <p className="text-sm font-semibold text-gray-700">No encontramos ese destino</p>
                  <p className="text-xs text-gray-400 mt-0.5">Prueba con: Estados Unidos, Canadá, España...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};