import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servicios de Asesoría de Visas y Diagnóstico VIPRO | TodoVisa",
  description: "Descubre nuestros servicios de asesoría de visados de primera vez y renovación para EE.UU., Canadá, México, Reino Unido y Australia. Evaluación VIPRO y asesores 1 a 1.",
  alternates: {
    canonical: "/services",
  },
  openGraph: {
    title: "Servicios de Asesoría de Visas Consulares | TodoVisa",
    description: "Asesoría integral de visas, llenado de formularios, perfilamiento y simulacro de entrevista.",
    url: "https://todovisa.com/services",
    siteName: "TodoVisa",
    locale: "es_SV",
    type: "website",
  },
};

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
