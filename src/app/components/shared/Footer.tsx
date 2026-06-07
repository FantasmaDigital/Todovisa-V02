"use client";

import Image from "next/image";

const footerLinks = {
  Servicios: [
    { label: "Asesoría Virtual", href: "#asesoria-virtual" },
    { label: "Evaluación VIPRO", href: "#evaluacion-vipro" },
    { label: "Cita Presencial", href: "#cita-presencial" },
    { label: "Cómo Funciona", href: "#como-funciona" },
  ],
  Compañía: [
    { label: "Sobre Nosotros", href: "#" },
    { label: "Red de Agentes", href: "#" },
    { label: "Preguntas Frecuentes", href: "#" },
    { label: "Blog de Viajes", href: "#" },
  ],
  Legal: [
    { label: "Política de Privacidad", href: "#" },
    { label: "Términos de Uso", href: "#" },
    { label: "Aviso de Cookies", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="w-full bg-[#0A2540] text-white">
      {/* Top bar */}
      <div className="w-[88%] max-w-7xl mx-auto py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 border-b border-white/10">

        {/* Brand column */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Image
            src="/images/todovisa.png"
            alt="TODOVISA Logo"
            width={90}
            height={90}
            className="object-contain"
          />
          <p className="text-sm text-white/60 leading-relaxed max-w-xs">
            Simplificamos tu proceso de visado con tecnología, asesoría experta y el respaldo de agentes certificados IATA.
          </p>
          {/* Social icons */}
          <div className="flex gap-4 mt-2">
            {[
              {
                label: "Instagram",
                href: "#",
                icon: (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zM12 7a5 5 0 1 1 0 10A5 5 0 0 1 12 7zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm5.25-.75a.875.875 0 1 1 0 1.75.875.875 0 0 1 0-1.75z" />
                  </svg>
                ),
              },
              {
                label: "Facebook",
                href: "#",
                icon: (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.522-4.478-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                ),
              },
              {
                label: "WhatsApp",
                href: "#",
                icon: (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                ),
              },
            ].map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-brand-primary flex items-center justify-center text-white/70 hover:text-white transition-all duration-200"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(footerLinks).map(([category, links]) => (
          <div key={category} className="flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{category}</h4>
            <ul className="flex flex-col gap-3">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm text-white/60 hover:text-white transition-colors duration-200"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="w-[88%] max-w-7xl mx-auto py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
        <span>© {new Date().getFullYear()} TODOVISA. Todos los derechos reservados.</span>
        <span className="flex items-center gap-2">
          Agente Acreditado
          <span className="font-bold text-white/50">IATA</span>
        </span>
      </div>
    </footer>
  );
}
