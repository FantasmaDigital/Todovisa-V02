"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

export default function ForgotPasswordForm() {
    const [authError, setAuthError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [sentEmail, setSentEmail] = useState("");

    type ForgotPasswordInputs = {
        Email: string;
    };

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInputs>();

    const handleResetPassword = async (data: ForgotPasswordInputs) => {
        setIsLoading(true);
        setAuthError(null);
        const emailVal = (data.Email || "").trim().toLowerCase();

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: emailVal, Email: emailVal }),
            });

            const resData = await response.json();

            if (!response.ok) {
                throw new Error(resData.error || 'Error al intentar solicitar el restablecimiento de contraseña.');
            }

            setSentEmail(emailVal);
            setIsSuccess(true);
        } catch (error: any) {
            setAuthError(error.message || 'Error desconocido al solicitar la recuperación de contraseña.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-md flex flex-col gap-6">
                <section className='flex flex-col gap-2 items-center text-center'>
                    <a href="/"><img src="/images/todovisa.png" alt="Logo de TodoVisa" className='w-32 mb-2' /></a>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">¿Olvidaste tu contraseña?</h1>
                    <p className="text-sm text-gray-600">Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.</p>
                </section>

                {isSuccess ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">¡Enlace Enviado!</h2>
                        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                            Hemos enviado las instrucciones para restablecer tu contraseña a <strong>{sentEmail}</strong>. Por favor revisa tu bandeja de entrada o carpeta de spam.
                        </p>
                        <Link
                            href="/auth/signin"
                            className="inline-block w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-hover text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
                        >
                            Regresar a Iniciar Sesión
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(handleResetPassword)} className="flex flex-col gap-4 w-full">
                        {authError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 text-center font-medium flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {authError}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                Correo electrónico
                            </label>
                            <input
                                className={`w-full border rounded-lg px-3.5 py-2.5 text-sm transition-colors outline-none focus:ring-2 ${errors.Email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-brand-primary focus:ring-blue-100'}`}
                                type="email"
                                placeholder="tuemail@ejemplo.com"
                                {...register("Email", {
                                    required: "El correo electrónico es obligatorio",
                                    pattern: { value: /^\S+@\S+\.\S+$/i, message: "El formato del correo no es válido" }
                                })}
                            />
                            {errors.Email && <span className="text-red-500 text-xs mt-1 block">{errors.Email.message}</span>}
                        </div>

                        <button
                            className="w-full border border-brand-primary bg-brand-primary hover:bg-brand-hover cursor-pointer transition-colors text-white font-semibold rounded-lg px-4 py-2.5 text-sm mt-2 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Enviando...
                                </>
                            ) : (
                                'Enviar enlace de restablecimiento'
                            )}
                        </button>

                        <div className="flex justify-end w-full mt-2">
                            <Link href="/auth/signin" className="text-xs text-brand-primary hover:underline font-semibold transition-all">
                                ¿Ya tienes una cuenta? Inicia sesión
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}