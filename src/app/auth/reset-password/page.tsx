"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import supabase from "@/app/lib/supabase";

function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Listen for hash fragment from Supabase auth reset link (#access_token=...&type=recovery)
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || accessToken,
        }).catch((e) => console.warn("Set session error:", e));
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try directly updating via client SDK session
      const { error: clientErr } = await supabase.auth.updateUser({ password });
      
      if (!clientErr) {
        setSuccess(true);
        setIsLoading(false);
        return;
      }

      // 2. Fallback to API route
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          access_token: accessToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al restablecer la contraseña.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Error al actualizar la contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-white">
      {/* Left side banner */}
      <div
        className="hidden md:flex flex-col justify-center items-center w-[60%] p-12 text-white"
        style={{
          backgroundImage: 'url("/images/backgrounds/canada.webp")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-md flex flex-col gap-8 text-center">
          <h2 className="text-5xl font-extrabold tracking-tight">TodoVisa</h2>
          <p className="text-lg text-white/90 leading-relaxed">
            Restablece tu contraseña de forma segura para volver a acceder a la gestión de tus trámites consulares.
          </p>
        </div>
      </div>

      {/* Right side form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md flex flex-col gap-6">
          <div className="text-center">
            <Link href="/" className="inline-block mb-4">
              <img src="/images/todovisa.png" alt="TodoVisa" className="h-10 mx-auto" />
            </Link>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
              Nueva Contraseña
            </h1>
            <p className="text-sm text-gray-600">
              Define una nueva contraseña para tu cuenta de TodoVisa.
            </p>
          </div>

          {success ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">¡Contraseña Actualizada!</h2>
              <p className="text-sm text-gray-600 mb-6">
                Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión con tus nuevas credenciales.
              </p>
              <button
                onClick={() => router.push("/auth/signin")}
                className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-hover text-white font-semibold rounded-xl shadow-lg transition-all text-sm"
              >
                Iniciar Sesión Ahora
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 text-center font-medium flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm transition-colors outline-none focus:border-brand-primary focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm transition-colors outline-none focus:border-brand-primary focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-lg shadow-sm transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  "Guardar Nueva Contraseña"
                )}
              </button>

              <div className="pt-2 text-center">
                <Link href="/auth/signin" className="text-xs text-brand-primary font-semibold hover:underline">
                  ← Regresar al Inicio de Sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
