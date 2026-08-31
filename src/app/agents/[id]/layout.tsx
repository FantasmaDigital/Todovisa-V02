import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil de Asesor Consular Certificado | TodoVisa",
  description: "Conoce la experiencia, calificaciones y especialidades consulares de nuestro asesor certificado en la red TodoVisa.",
  openGraph: {
    title: "Asesor Consular Certificado | TodoVisa",
    description: "Contrata tu asesoría integral para tramitación de visado.",
    siteName: "TodoVisa",
    locale: "es_SV",
    type: "profile",
  },
};

export default function AgentDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
