"use client"

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordForm() {
    const [authError, setAuthError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    type ForgotPasswordInputs = {
        Email: string;
    };

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordInputs>();


    // Handles submitting the email to initiate password reset flow.
    const handleResetPassword = async (data: ForgotPasswordInputs) => {
        setIsLoading(true);
        setAuthError(null);

        try {
            // API call for password reset, handled by the dedicated route handler.
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al intentar recuperar la contraseña.');
            }

            // On success, redirect to sign-in or show a success message
            alert('Se ha enviado un email con las instrucciones de restablecimiento de contraseña.');
            router.push('/auth/signin');

        } catch (error: any) {
            setAuthError(error.message || 'Error desconocido al solicitar la recuperación de contraseña.');
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-8">
            <form onSubmit={handleSubmit(handleResetPassword)} className="w-full max-w-md flex flex-col gap-6">
                <section className='flex flex-col gap-2 items-center'>
                    <h1 className="text-4xl font-bold mb-1 text-center text-gray-800">¿Olvidaste tu contraseña?</h1>
                    <a href="/"><img src="/images/todovisa.png" alt="Logo de TodoVisa" className='w-32 mb-4' /></a>
                    <p className="text-md text-gray-600 mb-4 text-center">Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.</p>
                </section>
                <section className='flex flex-col gap-4 w-full'>
                    <div>
                        <input
                            className={`w-full border-[1px] rounded-md px-3 py-2 text-md transition-colors outline-none focus:ring-1 ${errors.Email ? 'border-red-500 focus:ring-red-500' : 'border-border-light focus:border-brand-primary focus:ring-brand-primary'}`}
                            type="email"
                            placeholder="Correo electrónico"
                            {...register("Email", {
                                required: "El correo es obligatorio",
                                pattern: { value: /^\S+@\S+$/i, message: "El formato del correo no es válido" }
                            })}
                        />
                        {errors.Email && <span className="text-red-500 text-sm mt-1">{errors.Email.message}</span>}
                    </div >

                    <button
                        className="w-full border-[1px] border-brand-primary bg-brand-primary hover:bg-brand-hover cursor-pointer transition-colors text-white font-medium rounded-md px-4 py-2.5 text-md mt-2 disabled:opacity-50"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Enviando...' : 'Enviar enlace de restablecimiento'}
                    </button>

                </section>
                <div className="flex justify-end w-full">
                    <Link href="/auth/signin" className="text-sm text-brand-primary hover:underline font-medium transition-all">¿Ya tienes una cuenta? Inicia sesión</Link>
                </div>
            </form>
        </div>
    );
}