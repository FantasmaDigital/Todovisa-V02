"use client"
import { useForm, SubmitHandler } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '../../service/AuthService';
import { useAuthStore } from '../../store/authStore';

type SignInInputs = {
    Email: string;
    Password: string;
};

export default function SignInForm() {
    const { register, handleSubmit, formState: { errors } } = useForm<SignInInputs>();
    const [authError, setAuthError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);

    const onSubmit: SubmitHandler<SignInInputs> = async (data) => {
        setIsLoading(true);
        setAuthError(null);
        
        try {
            const result = await AuthService.signIn(data.Email, data.Password);
            
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
            setAuthError(error.message || 'Error de red al iniciar sesión');
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const result = await AuthService.googleSignIn(`${window.location.origin}/`);
            if (result.url) {
                window.location.href = result.url;
            }
        } catch (error: any) {
            setAuthError(error.message || 'Error de red al iniciar sesión con Google');
        }
    };

    return (
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full h-full max-w-md flex flex-col justify-center items-center gap-6 m-auto p-4">

            <section className='flex flex-col gap-2 items-center'>
                <h1 className="text-4xl font-bold mb-1 text-center text-gray-800">Bienvenido a</h1>
                <a href="/"><img src="/images/todovisa.png" alt="Logo de TodoVisa" className='w-32 mb-4' /></a>
                <p className="text-md text-gray-600 mb-4 text-center">Inicia sesión para continuar</p>
            </section>

            <section className='flex flex-col gap-4 w-full'>
                <div className="flex flex-col">
                    <input
                        className={`w-full border-[1px] rounded-md px-3 py-2 text-md transition-colors outline-none focus:ring-1 ${errors.Email ? 'border-brand-primary focus:ring-brand-primary' : 'border-border-light focus:border-brand-primary focus:ring-brand-primary'}`}
                        type="email"
                        placeholder="Email"
                        {...register("Email", {
                            required: "El correo es obligatorio",
                            pattern: {
                                value: /^\S+@\S+$/i,
                                message: "El formato del correo no es válido"
                            }
                        })}
                    />
                    {errors.Email && <span className="text-red-500 text-sm mt-1">{errors.Email.message}</span>}
                </div>

                <div className="flex flex-col">
                    <input
                        className={`w-full border-[1px] rounded-md px-3 py-2 text-md transition-colors outline-none focus:ring-1 ${errors.Password ? 'border-brand-primary focus:ring-brand-primary' : 'border-border-light focus:border-brand-primary focus:ring-brand-primary'}`}
                        type="password"
                        placeholder="Contraseña"
                        {...register("Password", {
                            required: "La contraseña es obligatoria",
                            minLength: {
                                value: 8,
                                message: "Debe tener al menos 8 caracteres"
                            },
                            pattern: {
                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
                                message: "Debe incluir mayúscula, minúscula y un número"
                            }
                        })}
                    />
                    {errors.Password && <span className="text-red-500 text-sm mt-1">{errors.Password.message}</span>}
                </div>

                <div className="flex justify-end w-full">
                    <a href="#" className="text-sm text-brand-primary hover:underline font-medium transition-all">¿Olvidaste tu contraseña?</a>
                </div>
                <div className="w-full">
                    {authError && <div className="text-red-500 text-sm mb-4 text-center">{authError}</div>}
                    <button
                        className="w-full border-[1px] border-brand-primary bg-brand-primary hover:bg-brand-hover cursor-pointer transition-colors text-white font-medium rounded-md px-4 py-2.5 text-md mt-2 disabled:opacity-50"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                    </button>

                    <div className="flex items-center w-full my-4">
                        <hr className="w-full border-border-light" />
                        <p className="px-3 text-sm text-gray-500">o</p>
                        <hr className="w-full border-border-light" />
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-2 border-[1px] border-gray-300 bg-white hover:bg-gray-50 transition-colors text-gray-700 font-medium rounded-md px-4 py-2.5 text-md cursor-pointer"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                            <path fill="none" d="M1 1h22v22H1z" />
                        </svg>
                        Continuar con Google
                    </button>
                </div>

                <div className="flex justify-center w-full mt-2">
                    <p className="text-sm text-gray-600">¿No tienes cuenta? <a href="/auth/signup" className="text-brand-primary font-medium hover:underline transition-all">Regístrate</a></p>
                </div>
            </section>
        </form>
        </div>
    );
}