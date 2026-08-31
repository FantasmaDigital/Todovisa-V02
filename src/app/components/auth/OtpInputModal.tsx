"use client";

import React, { useState, useRef, useEffect } from "react";
import { AuthService } from "@/app/service/AuthService";

interface OtpInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  purpose?: string;
  onVerified: () => void;
  title?: string;
  subtitle?: string;
}

export default function OtpInputModal({
  isOpen,
  onClose,
  email,
  purpose = "verification",
  onVerified,
  title = "Verificación por Código OTP",
  subtitle,
}: OtpInputModalProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [debugCode, setDebugCode] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, resendCooldown]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(["", "", "", "", "", ""]);
      setError(null);
      setSuccessMsg(null);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (index: number, value: string) => {
    // Only accept numeric input
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal && value !== "") return;

    const newDigits = [...digits];
    newDigits[index] = cleanVal.slice(-1); // Take last char if multiple entered
    setDigits(newDigits);
    setError(null);

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits entered
    if (newDigits.every((d) => d !== "") && cleanVal) {
      handleVerify(newDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    const numericCode = pastedData.replace(/\D/g, "").slice(0, 6);

    if (numericCode.length > 0) {
      const newDigits = ["", "", "", "", "", ""];
      for (let i = 0; i < numericCode.length; i++) {
        newDigits[i] = numericCode[i];
      }
      setDigits(newDigits);
      setError(null);

      // Focus last filled digit or final box
      const targetIdx = Math.min(numericCode.length, 5);
      inputRefs.current[targetIdx]?.focus();

      if (numericCode.length === 6) {
        handleVerify(numericCode);
      }
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || digits.join("");
    if (fullCode.length !== 6) {
      setError("Por favor, ingresa los 6 dígitos del código OTP.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await AuthService.verifyOtp(email, fullCode, purpose);
      if (!res.valid) {
        setError(res.error || "El código ingresado no es válido.");
        setIsLoading(false);
        return;
      }

      setSuccessMsg("¡Código verificado con éxito!");
      setIsLoading(false);
      setTimeout(() => {
        onVerified();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Error al verificar el código.");
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isSending) return;

    setIsSending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await AuthService.sendOtp(email, purpose);
      setIsSending(false);

      if (res.error) {
        setError(res.error);
        if (res.remainingSeconds) {
          setResendCooldown(res.remainingSeconds);
        }
        return;
      }

      setResendCooldown(60);
      setSuccessMsg("Se ha enviado un nuevo código OTP a tu correo.");
      if (res.debugCode) {
        setDebugCode(res.debugCode);
      }
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setIsSending(false);
      setError(err.message || "Error al solicitar un nuevo código.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 sm:p-8 relative overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Background glow decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          aria-label="Cerrar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#113E5F] border border-blue-100 shadow-inner">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h2 className="text-2xl font-bold text-center text-gray-900 tracking-tight mb-2">
          {title}
        </h2>
        <p className="text-sm text-center text-gray-600 mb-6">
          {subtitle || (
            <>
              Ingresa el código numérico de 6 dígitos enviado a<br />
              <strong className="text-gray-800 font-semibold">{email}</strong>
            </>
          )}
        </p>

        {/* Debug code notice if in local simulated mode */}
        {debugCode && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-center font-mono">
            💡 <strong>Modo Simulación Dev:</strong> Código OTP generado: <strong>{debugCode}</strong>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 text-center font-medium flex items-center justify-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 text-center font-medium flex items-center justify-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMsg}
          </div>
        )}

        {/* 6 Digit Input Group */}
        <div className="flex justify-center gap-2 sm:gap-3 my-6" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold font-mono rounded-xl border-2 transition-all outline-none ${
                digit
                  ? "border-[#113E5F] bg-blue-50/50 text-[#113E5F] ring-2 ring-blue-100"
                  : "border-gray-200 bg-gray-50/50 text-gray-800 focus:border-[#113E5F] focus:bg-white focus:ring-4 focus:ring-blue-100"
              }`}
            />
          ))}
        </div>

        {/* Verify Action Button */}
        <button
          onClick={() => handleVerify()}
          disabled={isLoading || digits.some((d) => !d)}
          className="w-full py-3 px-4 bg-[#113E5F] hover:bg-[#0d314b] text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Verificando...
            </>
          ) : (
            "Verificar Código OTP"
          )}
        </button>

        {/* Resend Section */}
        <div className="mt-6 text-center text-xs text-gray-500">
          ¿No recibiste el código?{" "}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || isSending}
            className="text-[#113E5F] font-bold hover:underline disabled:text-gray-400 disabled:no-underline transition-colors"
          >
            {isSending
              ? "Enviando..."
              : resendCooldown > 0
              ? `Reenviar en ${resendCooldown}s`
              : "Solicitar nuevo código"}
          </button>
        </div>
      </div>
    </div>
  );
}
