import type { Metadata } from "next";
import { countryVisaData } from "@/app/constants/visas/data";

type Props = {
  params: Promise<{ country: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const countryKey = country ? country.toLowerCase() : "";
  const info = countryVisaData[countryKey] || countryVisaData[country?.toUpperCase() || ""];

  if (!info) {
    return {
      title: "Guía de Visa | TodoVisa",
      description: "Información y requisitos de visa para viajar al extranjero.",
    };
  }

  const title = `Guía Oficial de Visa para ${info.name} | Requisitos y Cita Consular - TodoVisa`;
  const description = `Conoce los requisitos oficiales, aranceles consulares, estados de cuenta y procedimientos paso a paso para tramitar tu visa a ${info.name}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/visas/${countryKey}`,
    },
    openGraph: {
      title,
      description,
      url: `https://todovisa.com/visas/${countryKey}`,
      siteName: "TodoVisa",
      locale: "es_SV",
      type: "article",
    },
  };
}

export default function DynamicVisaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
