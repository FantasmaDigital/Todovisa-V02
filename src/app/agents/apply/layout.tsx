import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Robots & Indexing",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SensitiveNoIndexLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
