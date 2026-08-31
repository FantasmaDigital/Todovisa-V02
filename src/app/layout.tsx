import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OAuthCallbackListener } from "./components/shared/OAuthCallbackListener";
import { SettingsInitializer } from "./components/shared/SettingsInitializer";
import { ChatbotWidget } from "./components/shared/ChatbotWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://todovisa.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "TodoVisa - Tu visa sin estrés, guiada por expertos",
    template: "%s | TodoVisa",
  },
  description: "Simplificamos tu proceso de visado con tecnología, asesoría experta y el respaldo de agentes certificados. Completa tu evaluación inicial hoy.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TodoVisa - Tu visa sin estrés, guiada por expertos",
    description: "Simplificamos tu proceso de visado con tecnología, asesoría experta y el respaldo de agentes certificados.",
    url: baseUrl,
    siteName: "TodoVisa",
    locale: "es_SV",
    type: "website",
    images: [
      {
        url: "/images/estadosunidos.webp",
        width: 1200,
        height: 630,
        alt: "TodoVisa Asesoría Consular",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TodoVisa - Tu visa sin estrés, guiada por expertos",
    description: "Simplificamos tu proceso de visado con tecnología, asesoría experta y el respaldo de agentes certificados.",
    images: ["/images/estadosunidos.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/todovisa.ico",
    shortcut: "/todovisa.ico",
    apple: "/todovisa.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "TodoVisa",
    "url": baseUrl,
    "logo": `${baseUrl}/todovisa.ico`,
    "image": `${baseUrl}/images/estadosunidos.webp`,
    "description": "Plataforma de consultoría migratoria y evaluación de viabilidad consular de visas para Estados Unidos, Canadá, México, Reino Unido y Australia.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "San Salvador",
      "addressCountry": "SV"
    },
    "areaServed": ["SV", "MX", "GT", "HN", "NI", "CR", "PA", "CO", "PE", "EC", "BO"],
    "priceRange": "$$"
  };

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <OAuthCallbackListener />
        <SettingsInitializer />
        {children}
        <ChatbotWidget />
      </body>
    </html>
  );
}
