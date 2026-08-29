import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Red de Asesores Consulares Certificados | TodoVisa",
  description: "Encuentra y contrata a tu asesor migratorio experto para la elaboración de formulario DS-160, auditoría de expediente y simulacro de entrevista por Zoom.",
  alternates: {
    canonical: "/agents",
  },
  openGraph: {
    title: "Red de Asesores Consulares Certificados | TodoVisa",
    description: "Conecta con expertos verificados para tramitar tu visa de forma segura.",
    url: "https://todovisa.com/agents",
    siteName: "TodoVisa",
    locale: "es_SV",
    type: "website",
  },
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
