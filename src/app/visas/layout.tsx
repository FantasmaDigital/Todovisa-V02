import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guías Oficiales de Visa por País | Catálogo Consular TodoVisa",
  description: "Explora los requisitos de visado, aranceles consulares, estados de cuenta probatorios y procedimientos para solicitar visa a Estados Unidos, Canadá, México, Reino Unido y Australia.",
  alternates: {
    canonical: "/visas",
  },
  openGraph: {
    title: "Guías Oficiales de Visa por País | TodoVisa",
    description: "Catálogo consular global con requisitos y guías paso a paso.",
    url: "https://todovisa.com/visas",
    siteName: "TodoVisa",
    locale: "es_SV",
    type: "website",
  },
};

export default function VisasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
