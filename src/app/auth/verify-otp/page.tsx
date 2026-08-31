"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/shared/Header";
import OtpInputModal from "@/app/components/auth/OtpInputModal";
import { AuthService } from "@/app/service/AuthService";

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("verification");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedSuccess, setVerifiedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const paramEmail = searchParams.get("email");
    const paramPurpose = searchParams.get("purpose");

    if (paramEmail) {
      setEmail(paramEmail);
      if (paramPurpose) setPurpose(paramPurpose);
      // Auto-open modal or trigger OTP request
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !/^\S+@\S+\.\S+$/i.test(cleanEmail)) {
      setError("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const res = await AuthService.sendOtp(cleanEmail, purpose);
      setIsSending(false);

      if (res.error) {
        setError(res.error);
        return;
      }

      setIsModalOpen(true);
    } catch (err: any) {
      setIsSending(false);
      setError(err.message || "Error al solicitar el código de verificación.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Header />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10 my-8">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-10 relative overflow-hidden">
          {/* Header Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#113E5F] via-blue-600 to-[#113E5F]" />

          {/* Logo & Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <img src="/images/todovisa.png" alt="TodoVisa" className="h-10 mx-auto" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Verificación de Seguridad
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              Ingresa tu correo para recibir un código de verificación OTP de 6 dígitos
            </p>
          </div>

          {verifiedSuccess ? (
            <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">¡Verificación Exitosa!</h2>
              <p className="text-sm text-gray-600 mb-6">
                Tu correo <strong>{email}</strong> ha sido verificado correctamente en la plataforma TodoVisa.
              </p>
              <button
                onClick={() => router.push("/")}
                className="w-full py-3 px-4 bg-[#113E5F] hover:bg-[#0d314b] text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all text-sm"
              >
                Volver al Inicio
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendOtp} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 text-center font-medium flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#113E5F] focus:ring-4 focus:ring-blue-50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Motivo de Verificación
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#113E5F] focus:ring-4 focus:ring-blue-50 transition-all bg-white"
                >
                  <option value="verification">Verificación de Cuenta</option>
                  <option value="login">Inicio de Sesión Seguro</option>
                  <option value="password_reset">Restablecimiento de Contraseña</option>
                  <option value="identity_confirm">Confirmación de Identidad</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSending || !email}
                className="w-full py-3.5 px-4 bg-[#113E5F] hover:bg-[#0d314b] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {isSending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Enviando código...
                  </>
                ) : (
                  "Enviar Código OTP por Correo"
                )}
              </button>

              <div className="pt-4 text-center border-t border-gray-100">
                <Link href="/auth/signin" className="text-xs text-[#113E5F] font-semibold hover:underline">
                  ← Regresar al Inicio de Sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* OTP Interactive Verification Modal */}
      <OtpInputModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        email={email}
        purpose={purpose}
        onVerified={() => setVerifiedSuccess(true)}
      />

      <footer className="py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} TodoVisa. Todos los derechos reservados.
      </footer>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
