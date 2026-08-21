import { redirect } from "next/navigation";

export default async function ReferidoPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const resolvedParams = await searchParams;
  const queryString = new URLSearchParams(resolvedParams as Record<string, string>).toString();
  redirect(`/referral${queryString ? `?${queryString}` : ""}`);
}
