import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre TodoVisa | Consultoría Consular y Evaluación VIPRO",
  description: "Conoce nuestra historia y cómo combinamos la evaluación de viabilidad consular VIPRO con asesores certificados para guiar tu proceso de visa sin estrés.",
  alternates: {
    canonical: "/about-us",
  },
  openGraph: {
    title: "Sobre TodoVisa | Consultoría Consular Experta",
    description: "Reinventando la consultoría migratoria con tecnología VIPRO y rigor consular.",
    url: "https://todovisa.com/about-us",
    siteName: "TodoVisa",
    locale: "es_SV",
    type: "website",
  },
};

export default function AboutUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
