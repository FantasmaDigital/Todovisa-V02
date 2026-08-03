import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OAuthCallbackListener } from "./components/shared/OAuthCallbackListener";
import { SettingsInitializer } from "./components/shared/SettingsInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TodoVisa - Tu visa sin estrés, guiada por expertos",
  description: "Simplificamos tu proceso de visado con tecnología, asesoría experta y el respaldo de agentes certificados. Completa tu evaluación inicial hoy.",
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
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <OAuthCallbackListener />
        <SettingsInitializer />
        {children}
      </body>
    </html>
  );
}
