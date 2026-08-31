import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evaluación VIPRO de Viabilidad Consular | TodoVisa",
  description: "Diagnostica tus probabilidades de éxito y solvencia para visas de EE.UU., Canadá, Reino Unido y Australia antes de solicitar formalmente.",
  alternates: {
    canonical: "/vipro-form",
  },
  openGraph: {
    title: "Evaluación VIPRO de Viabilidad Consular | TodoVisa",
    description: "Diagnóstico algorítmico predictivo de viabilidad para visa de no inmigrante.",
    url: "https://todovisa.com/vipro-form",
    siteName: "TodoVisa",
    locale: "es_SV",
    type: "website",
  },
};

export default function ViproFormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
