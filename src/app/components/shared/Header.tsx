import Image from "next/image"
import Link from "next/link"

export const Header = ({ headerRef }: { headerRef: any }) => {
    return (
        <header ref={headerRef} className="w-full bg-background-main sticky top-0 z-50 flex flex-col justify-center">
            <div className="bg-brand-primary w-full m-auto sticky p-2 flex justify-center font-bold text-white text-sm">
                <span className="cursor-pointer">Evaluación VIPRO — Obtén un 25% de descuento al completar tu perfil &nbsp;→</span>
            </div>

            <div className="flex flex-col w-full py-3">
                <nav className="w-[88%] m-auto flex flex-row items-center">
                    <div className="flex-shrink-0">
                        <a href="/">
                            <Image
                                src="/images/todovisa.png"
                                alt="Logo TODOVISA"
                                width={72}
                                height={72}
                                className="object-contain"
                            />
                        </a>
                    </div>

                    <div className="hidden md:flex flex-row items-center gap-10 ml-10 text-sm font-medium text-text-secondary">
                        <a href="#asesoria-virtual" className="hover:text-brand-primary transition-colors duration-200">Servicios</a>
                        <a href="#evaluacion-vipro" className="hover:text-brand-primary transition-colors duration-200">Evaluación VIPRO</a>
                        <a href="#como-funciona" className="hover:text-brand-primary transition-colors duration-200">Cómo funciona</a>

                        <div className="relative group py-2">
                            <button className="flex items-center gap-1 hover:text-brand-primary transition-colors duration-200 focus:outline-none">
                                Agentes
                                <svg className="w-3.5 h-3.5 text-text-secondary group-hover:text-brand-primary transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>
                            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-white border border-border-light rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2 flex flex-col gap-1">
                                <a href="#buscar-agentes" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-primary hover:bg-brand-light hover:text-brand-primary transition-all duration-200">
                                    <span className="p-1.5 bg-brand-light rounded-md text-brand-primary">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                                        </svg>
                                    </span>
                                    <div className="flex flex-col text-left">
                                        <span className="font-semibold text-xs leading-none">Buscar agentes</span>
                                        <span className="text-[10px] text-text-secondary mt-1">Encuentra tu experto</span>
                                    </div>
                                </a>
                                <a href="#unirte-red" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-primary hover:bg-brand-light hover:text-brand-primary transition-all duration-200">
                                    <span className="p-1.5 bg-brand-light rounded-md text-brand-primary">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                        </svg>
                                    </span>
                                    <div className="flex flex-col text-left">
                                        <span className="font-semibold text-xs leading-none">Unirte a la red</span>
                                        <span className="text-[10px] text-text-secondary mt-1">Aplica como experto</span>
                                    </div>
                                </a>
                            </div>
                        </div>

                        <a href="#cita-presencial" className="hover:text-brand-primary transition-colors duration-200">Contacto</a>
                    </div>

                    <div className="flex flex-row items-center gap-4 ml-auto">
                        <Link href="/auth/signin" className="hidden sm:block text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                            Iniciar Sesión
                        </Link>
                        <Link
                            href="/auth/signup"
                            className="bg-brand-primary text-white font-semibold px-5 py-2 rounded-sm w-max h-min flex justify-center items-center hover:bg-brand-hover transition-colors duration-200 border-none text-sm"
                        >
                            Comenzar
                        </Link>
                    </div>

                </nav>
            </div>
        </header>
    )
}