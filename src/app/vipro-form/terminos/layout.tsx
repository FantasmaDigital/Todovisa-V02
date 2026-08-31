import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones de Uso VIPRO | TodoVisa",
  description: "Términos y condiciones oficiales del servicio de autoevaluación de elegibilidad VIPRO para visas de no inmigrante.",
  alternates: {
    canonical: "/vipro-form/terminos",
  },
};

export default function ViproTerminosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
