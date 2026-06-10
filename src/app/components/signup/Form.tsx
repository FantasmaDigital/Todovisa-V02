"use client"
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { countries } from 'countries-list';
import { useRouter } from 'next/navigation';
import { AuthService } from '../../service/AuthService';
import { useAuthStore } from '../../store/authStore';

// 1. Interfaz actualizada con ConfirmPassword
type SignUpInputs = {
    Nombre: string;
    Apellido: string;
    Email: string;
    Pais: string;
    Telefono: string;
    Password: string;
    ConfirmPassword: string;
};

const countriesArray = Object.entries(countries)
    .map(([code, data]: [string, any]) => ({
        code,
        name: data.name,
        dial: `+${typeof data.phone === 'string' ? data.phone.split(',')[0] : data.phone[0]}`
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

export default function SignUpForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<SignUpInputs>({
        defaultValues: { Pais: 'SV' }
    });

    const onSubmit: SubmitHandler<SignUpInputs> = async (data) => {
        setIsLoading(true);
        setAuthError(null);
        const selectedCountry = countriesArray.find(c => c.code === data.Pais);
        const fullPhone = `${selectedCountry?.dial} ${data.Telefono}`;

        try {
            const result = await AuthService.signUp({
                email: data.Email,
                password: data.Password,
                first_name: data.Nombre,
                last_name: data.Apellido,
                phone: fullPhone,
                country: data.Pais
            });

            if (result.data?.user) {
                const userObj = result.data.user;
                const metadata = userObj.user_metadata || {};
                setUser({
                    id: userObj.id,
                    email: userObj.email || '',
                    firstName: metadata.first_name || '',
                    lastName: metadata.last_name || '',
                    phone: metadata.phone || '',
                    country: metadata.country || ''
                });
            }

            router.push('/');
        } catch (error: any) {
            setAuthError(error.message || 'Error de red al crear la cuenta');
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            const result = await AuthService.googleSignIn(`${window.location.origin}/`);
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error: any) {
            setAuthError(error.message || 'Error de red al iniciar sesión con Google');
        }
    };

    const selectedCountryCode = watch("Pais");
    const currentPrefix = countriesArray.find(c => c.code === selectedCountryCode)?.dial || '+00';
    const currentPassword = watch("Password");

    return (
        <>
            <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md flex flex-col gap-6">

                    <section className='flex flex-col gap-2 items-center'>
                        <h1 className="text-4xl font-bold mb-1 text-center text-gray-800">Crea tu cuenta</h1>
                        <a href="/"><img src="/images/todovisa.png" alt="Logo de TodoVisa" className='w-32 mb-4' /></a>
                        <p className="text-md text-gray-600 mb-4 text-center">Ingresa tus datos para registrarte</p>
                    </section>

                    <section className='flex flex-col gap-4 w-full'>

                        {/* Fila: Nombre y Apellido */}
                        <div className="flex gap-4 w-full">
                            <div className="flex flex-col w-1/2">
                                <input
                                    className={`w-full border-[1px] rounded-md px-3 py-2 text-md transition-colors outline-none focus:ring-1 ${errors.Nombre ? 'border-red-500 focus:ring-red-500' : 'border-border-light focus:border-brand-primary focus:ring-brand-primary'}`}
                                    type="text"
                                    placeholder="Nombre"
                                    {...register("Nombre", { required: "Requerido" })}
                                />
                                {errors.Nombre && <span className="text-red-500 text-xs mt-1">{errors.Nombre.message}</span>}
                            </div>

                            <div className="flex flex-col w-1/2">
                                <input
                                    className={`w-full border-[1px] rounded-md px-3 py-2 text-md transition-colors outline-none focus:ring-1 ${errors.Apellido ? 'border-red-500 focus:ring-red-500' : 'border-border-light focus:border-brand-primary focus:ring-brand-primary'}`}
                                    type="text"
                                    placeholder="Apellido"
                                    {...register("Apellido", { required: "Requerido" })}
                                />
                                {errors.Apellido && <span className="text-red-500 text-xs mt-1">{errors.Apellido.message}</span>}
                            </div>
                        </div>

                        {/* Campo: Email */}
                        <div className="flex flex-col">
                            <input
                                className={`w-full border-[1px] rounded-md px-3 py-2 text-md transition-colors outline-none focus:ring-1 ${errors.Email ? 'border-red-500 focus:ring-red-500' : 'border-border-light focus:border-brand-primary focus:ring-brand-primary'}`}
                                type="email"
                                placeholder="Correo electrónico"
                                {...register("Email", {
                                    required: "El correo es obligatorio",
                                    pattern: { value: /^\S+@\S+$/i, message: "Formato no válido" }
                                })}
                            />
                            {errors.Email && <span className="text-red-500 text-xs mt-1">{errors.Email.message}</span>}
                        </div>

                        {/* Fila: País y Teléfono (Agrupados para ahorrar espacio) */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full">
                            <div className="flex flex-col w-full sm:w-2/5">
                                <select
                                    className={`w-full border-[1px] rounded-md px-3 py-2 text-md transition-colors outline-none focus:ring-1 bg-white ${errors.Pais ? 'border-red-500 focus:ring-red-500' : 'border-border-light focus:border-brand-primary focus:ring-brand-primary'}`}
                                    {...register("Pais", { required: "Requerido" })}
                                >
                                    {countriesArray.map((country) => (
                                        <option key={country.code} value={country.code}>
                                            {country.code} ({country.dial})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col w-full sm:w-3/5">
                                <div className="flex relative">
                                    <span className="inline-flex items-center px-3 text-sm text-gray-600 bg-gray-100 border border-r-0 border-border-light rounded-l-md font-medium">
                                        {currentPrefix}
                                    </span>
                                    <input
                                        className={`w-full border-[1px] rounded-none rounded-r-md px-3 py-2 text-md transition-colors outline-none focus:ring-1 ${errors.Telefono ? 'border-red-500 focus:ring-red-500 z-10' : 'border-border-light focus:border-brand-primary focus:ring-brand-primary'}`}
                                        type="tel"
                                        placeholder="Número de teléfono"
                                        {...register("Telefono", {
                                            required: "Obligatorio",
                                            pattern: { value: /^[0-9]+$/, message: "Solo números" }
                                        })}
                                    />
                                </div>
                                {errors.Telefono && <span className="text-red-500 text-xs mt-1">{errors.Telefono.message}</span>}
                            </div>
                        </div>

                        {/* Campo: Contraseña (Con botón para ver) */}
                        <div className="flex flex-col relative">
                            <div className="relative flex items-center">
                                <input
                                    className={`w-full border-[1px] rounded-md pl-3 pr-10 py-2 text-md transition-colors outline-none focus:ring-1 ${errors.Password ? 'border-red-500 focus:ring-red-500' : 'border-border-light focus:border-brand-primary focus:ring-brand-primary'}`}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Contraseña"
                                    {...register("Password", {
                                        required: "La contraseña es obligatoria",
                                        minLength: { value: 8, message: "Mínimo 8 caracteres" }
                                    })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.Password && <span className="text-red-500 text-xs mt-1">{errors.Password.message}</span>}
                        </div>

                        {/* Campo: Confirmar Contraseña (Con botón para ver) */}
                        <div className="flex flex-col relative">
                            <div className="relative flex items-center">
                                <input
                                    className={`w-full border-[1px] rounded-md pl-3 pr-10 py-2 text-md transition-colors outline-none focus:ring-1 ${errors.ConfirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-border-light focus:border-brand-primary focus:ring-brand-primary'}`}
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirmar contraseña"
                                    {...register("ConfirmPassword", {
                                        required: "Debes confirmar tu contraseña",
                                        validate: value => value === currentPassword || "Las contraseñas no coinciden"
                                    })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.ConfirmPassword && <span className="text-red-500 text-xs mt-1">{errors.ConfirmPassword.message}</span>}
                        </div>

                        <div className="w-full mt-2">
                            {authError && <div className="text-red-500 text-sm mb-4 text-center">{authError}</div>}
                            <button
                                className="w-full border-[1px] border-brand-primary bg-brand-primary hover:bg-brand-hover cursor-pointer transition-colors text-white font-medium rounded-md px-4 py-2.5 text-md disabled:opacity-50"
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                            </button>

                            <div className="flex items-center w-full my-4">
                                <hr className="w-full border-border-light" />
                                <p className="px-3 text-sm text-gray-400">o</p>
                                <hr className="w-full border-border-light" />
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleSignUp}
                                className="w-full flex items-center justify-center gap-2 border-[1px] border-gray-300 bg-white hover:bg-gray-50 transition-colors text-gray-700 font-medium rounded-md px-4 py-2.5 text-md cursor-pointer"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    <path fill="none" d="M1 1h22v22H1z" />
                                </svg>
                                Registrarse con Google
                            </button>
                        </div>

                        <div className="flex justify-center w-full mt-1">
                            <p className="text-sm text-gray-600">
                                ¿Ya tienes cuenta? <a href="/auth/signin" className="text-brand-primary font-medium hover:underline transition-all">Inicia sesión</a>
                            </p>
                        </div>
                    </section>
                </form>
            </div>
        </>
    );
}