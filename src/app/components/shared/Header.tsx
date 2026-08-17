"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserAvatar } from "./UserAvatar"
import { useState, useEffect } from "react"
import { useAuthStore } from "@/app/store/authStore"
import { AuthService } from "@/app/service/AuthService"
import { AuthClientService } from "@/services/client/AuthClientService"
import { ProfileClientService } from "@/services/client/ProfileClientService"
import { AgencyClientService } from "@/services/client/AgencyClientService"
import { ROLES } from "@/app/constants/roles"
import { visaDestinations, getCentralizedDestinations } from "@/app/constants/visas/destinations"

export const Header = ({ headerRef }: { headerRef?: any }) => {
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const [isMounted, setIsMounted] = useState(false);
    const [showLoader, setShowLoader] = useState(true);
    const [headerDestinations, setHeaderDestinations] = useState(visaDestinations);

    useEffect(() => {
        setHeaderDestinations(getCentralizedDestinations());
        const handleStorage = () => setHeaderDestinations(getCentralizedDestinations());
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogoClick = (e: React.MouseEvent) => {
        if (pathname === "/") {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    useEffect(() => {
        setIsMounted(true);
        if (typeof window !== "undefined") {
            if (!(window as any).__fetch_intercepted__) {
                (window as any).__fetch_intercepted__ = true;
                const originalFetch = window.fetch;
                window.fetch = async function (input, init) {
                    let url = "";
                    if (typeof input === "string") {
                        url = input;
                    } else if (input instanceof URL) {
                        url = input.href;
                    } else if (input && typeof input === "object" && "url" in input) {
                        url = (input as any).url;
                    }

                    const isRelativeApi = url.startsWith("/api/") || url.startsWith("api/");
                    const isAbsoluteLocalApi = url.startsWith(window.location.origin + "/api/");
                    
                    if (isRelativeApi || isAbsoluteLocalApi) {
                        init = init || {};
                        let headers: Headers;
                        if (init.headers) {
                            headers = new Headers(init.headers);
                        } else if (input && typeof input === "object" && "headers" in input) {
                            headers = new Headers((input as any).headers);
                        } else {
                            headers = new Headers();
                        }
                        
                        let sessionToken: string | null = null;
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && (key.includes("auth-token") || key.startsWith("sb-"))) {
                                const sessionStr = localStorage.getItem(key);
                                if (sessionStr) {
                                    try {
                                        const parsed = JSON.parse(sessionStr);
                                        const tok = parsed?.access_token || parsed?.currentSession?.access_token;
                                        if (tok) {
                                            sessionToken = tok;
                                            break;
                                        }
                                    } catch (e) {}
                                }
                            }
                        }
                        if (sessionToken && !headers.has("Authorization")) {
                            headers.set("Authorization", `Bearer ${sessionToken}`);
                        }
                        
                        init.headers = headers;
                    }
                    return originalFetch.call(this, input, init);
                };
            }

            const params = new URLSearchParams(window.location.search);
            const refParam = params.get("ref") || params.get("agency_ref");
            if (refParam) {
                AgencyClientService.processAndStoreAgencyCode(refParam);
            }

            // Registrar escuchadores de eventos para refrescar el tiempo de actividad del usuario
            const handleUserActivity = () => {
                AuthClientService.updateLastActivity();
            };

            window.addEventListener("click", handleUserActivity);
            window.addEventListener("keydown", handleUserActivity);

            const timer = setTimeout(() => {
                setShowLoader(false);
            }, 300);
            return () => {
                clearTimeout(timer);
                window.removeEventListener("click", handleUserActivity);
                window.removeEventListener("keydown", handleUserActivity);
            };
        }
    }, []);


    useEffect(() => {
        const syncSession = async () => {
            try {
                // Verificar si la sesión expiró por más de 24 horas de inactividad
                if (AuthClientService.checkSessionInactivityTimeout()) {
                    useAuthStore.getState().clearUser();
                    return;
                }

                // Pre-check if any supabase session token exists in localStorage to avoid useless 401 calls
                let hasToken = false;
                if (typeof window !== "undefined") {
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
                            const val = localStorage.getItem(key);
                            if (val) {
                                try {
                                    const parsed = JSON.parse(val);
                                    if (parsed?.access_token) {
                                        hasToken = true;
                                    }
                                } catch (e) {}
                            }
                            break;
                        }
                    }
                }

                if (!hasToken) {
                    return;
                }

                // Si hay sesión activa, actualizar el registro de actividad reciente
                AuthClientService.updateLastActivity();

                // ⚡ Parallel fetch: user + profile role in one round-trip instead of two sequential calls
                const [userRes, profileResRaw] = await Promise.all([
                    AuthService.getUser().catch(() => null),
                    // We don't have the userId yet, so we kick off a small pre-fetch that resolves
                    // after we have the id — using a dummy that will be replaced below if needed.
                    Promise.resolve(null),
                ]);

                const supabaseUser = userRes?.data?.user;
                if (supabaseUser) {
                    // Sync / merge local agency referral code to Supabase metadata if exists
                    AgencyClientService.syncReferralOnLogin(supabaseUser);
                    // Fetch profile role now that we have the userId — this is the only call we can't parallelize
                    // without the user id, but we avoided the getSession() call above being repeated.
                    let profileRole = null;
                    let dbProfile: any = null;
                    try {
                        const profileRes = await ProfileClientService.getProfile(supabaseUser.id);
                        dbProfile = profileRes?.profile || null;
                        profileRole = dbProfile?.role;
                    } catch (pErr) {
                        console.warn("Could not fetch profile role:", pErr);
                    }

                    const metadata = supabaseUser.user_metadata || {};
                    const updatedUser = {
                        id: supabaseUser.id,
                        email: supabaseUser.email || '',
                        firstName: metadata.first_name || metadata.full_name?.split(' ')[0] || metadata.name?.split(' ')[0] || '',
                        lastName: metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || metadata.name?.split(' ').slice(1).join(' ') || '',
                        phone: metadata.phone || '',
                        country: metadata.country || '',
                        viproScore: metadata.vipro_score || null,
                        viproCompleted: metadata.vipro_completed || false,
                        viproDestination: metadata.vipro_destination || null,
                        hasPaidAdvisor: metadata.has_paid_advisor || false,
                        assignedAgentId: metadata.assigned_agent_id || null,
                        photoUrl: dbProfile?.photo_url || metadata.photo_url || metadata.avatar_url || metadata.picture || null,
                        avatarChangesThisMonth: metadata.avatar_changes_this_month || 0,
                        lastAvatarChangeMonth: metadata.last_avatar_change_month || '',
                        ds160FullName: metadata.ds160_full_name || null,
                        ds160PassportNum: metadata.ds160_passport_num || null,
                        ds160BirthDate: metadata.ds160_birth_date || null,
                        ds160PurposeOfTrip: metadata.ds160_purpose_of_trip || null,
                        ds160HasAssets: metadata.ds160_has_assets ?? true,
                        ds160Confirmed: metadata.ds160_confirmed || false,
                        expedienteStatus: dbProfile?.expediente_status || metadata.expediente_status || 'draft',
                        clientDocs: dbProfile?.client_docs || metadata.client_docs || {},
                        documentReviews: dbProfile?.document_reviews || metadata.document_reviews || {},
                        appointmentRequest: dbProfile?.appointment_request || dbProfile?.cita_details || metadata.appointment_request || null,
                        role: (profileRole as typeof ROLES[keyof typeof ROLES]) || ROLES.USER,
                    };

                    const currentUser = useAuthStore.getState().user;
                    const isDifferent = !currentUser || 
                        currentUser.id !== updatedUser.id || 
                        currentUser.role !== updatedUser.role || 
                        currentUser.email !== updatedUser.email || 
                        currentUser.firstName !== updatedUser.firstName ||
                        currentUser.lastName !== updatedUser.lastName ||
                        currentUser.photoUrl !== updatedUser.photoUrl;

                    if (isDifferent) {
                        useAuthStore.getState().setUser(updatedUser);
                    }
                }
            } catch (e) {
                console.error("Error syncing Google/OAuth user session in Header:", e);
            }
        };
        if (isMounted) {
            syncSession();
        }
    }, [isMounted]);

    const userData = isMounted ? user : null;

    return (
        <>
            {showLoader && (
                <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background-main transition-opacity duration-300 ${isMounted ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                </div>
            )}
            <header ref={headerRef} className="w-full bg-background-main sticky top-0 z-50 flex flex-col justify-center">
                {/* Promo Banner */}
                <div className="bg-brand-primary w-full p-2.5 flex justify-center font-bold text-white text-xs md:text-sm text-center">
                    {(userData ? Boolean(userData.viproCompleted || userData.viproScore || userData.hasCompletedVipro) : (typeof window !== "undefined" && (localStorage.getItem("vipro_completed") === "true" || Boolean(localStorage.getItem("vipro_score"))))) ? (
                        <Link href="/profile?tab=proceso" className="hover:underline flex items-center gap-1">
                            <span>📋 Diagnóstico Consular VIPRO completado — Revisa tu perfilamiento aquí &nbsp;→</span>
                        </Link>
                    ) : (
                        <Link href="/vipro-form" className="hover:underline flex items-center gap-1">
                            <span>Evaluación VIPRO — Completa tu perfil &nbsp;→</span>
                        </Link>
                    )}
                </div>

                <div className="flex flex-col w-full py-3.5 relative">
                    <nav className="w-[88%] m-auto flex flex-row items-center justify-between">
                        {/* LEFT SECTION: Logo & Desktop Links */}
                        <div className="flex items-center gap-10">
                            <div className="flex-shrink-0">
                                <Link href="/" onClick={handleLogoClick}>
                                    <Image
                                        src="/images/todovisa.png"
                                        alt="Logo TODOVISA"
                                        width={72}
                                        height={72}
                                        className="object-contain w-12 sm:w-16 md:w-20 h-auto"
                                    />
                                </Link>
                            </div>

                            {/* Desktop Nav Links */}
                            <div className="hidden lg:flex flex-row items-center gap-8 text-sm font-semibold text-text-secondary">
                                {/* Visas Dropdown */}
                                <div className="relative group py-2">
                                    <button className="flex items-center gap-1 hover:text-brand-primary transition-colors duration-200 focus:outline-none">
                                        Visas
                                        <svg className="w-3.5 h-3.5 text-text-secondary group-hover:text-brand-primary transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </button>
                                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-border-light rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1.5 flex flex-col gap-0.5">
                                        <Link href="/visas" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-text-primary hover:bg-brand-light hover:text-brand-primary transition-all duration-200 border-b border-border-light mb-1">
                                            <span className="p-1.5 bg-brand-light rounded-sm text-brand-primary">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                                </svg>
                                            </span>
                                            <div className="flex flex-col text-left">
                                                <span className="font-semibold text-xs leading-none">Ver todas las visas</span>
                                                <span className="text-[10px] text-text-secondary mt-1">Todos los destinos disponibles</span>
                                            </div>
                                        </Link>
                                        {headerDestinations.map((c: any) => (
                                            !c.enabled ? (
                                                <div key={c.code} className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm text-gray-300 cursor-not-allowed">
                                                    <span className="text-base">{c.flag}</span>
                                                    <span className="text-xs">{c.name}</span>
                                                    <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Pronto</span>
                                                </div>
                                            ) : (
                                                <Link key={c.code} href={`/visas/${c.code}`} className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm text-text-primary hover:bg-brand-light hover:text-brand-primary transition-all duration-200">
                                                    <span className="text-base">{c.flag}</span>
                                                    <span className="text-xs font-medium">{c.name}</span>
                                                </Link>
                                            )
                                        ))}
                                    </div>
                                </div>

                                {/* Agentes Dropdown */}
                                <div className="relative group py-2">
                                    <button className="flex items-center gap-1 hover:text-brand-primary transition-colors duration-200 focus:outline-none">
                                        Agentes
                                        <svg className="w-3.5 h-3.5 text-text-secondary group-hover:text-brand-primary transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </button>
                                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-white border border-border-light rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1.5 flex flex-col gap-0.5">
                                        <Link href="/agents" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-text-primary hover:bg-brand-light hover:text-brand-primary transition-all duration-200">
                                            <span className="p-1.5 bg-brand-light rounded-sm text-brand-primary">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
                                                </svg>
                                            </span>
                                            <div className="flex flex-col text-left">
                                                <span className="font-semibold text-xs leading-none">Buscar agentes</span>
                                                <span className="text-[10px] text-text-secondary mt-1">Encuentra tu experto</span>
                                            </div>
                                        </Link>
                                        {userData?.hasPaidAdvisor && (
                                            <Link href="/profile?tab=asesor" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-text-primary hover:bg-brand-light hover:text-brand-primary transition-all duration-200">
                                                <span className="p-1.5 bg-brand-light rounded-sm text-brand-primary">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742h.01m5.624 0h.01m-5.632 4.41h5.631M12 21a9 9 0 100-18 9 9 0 000 18z" />
                                                    </svg>
                                                </span>
                                                <div className="flex flex-col text-left">
                                                    <span className="font-semibold text-xs leading-none">Mi asesor asignado</span>
                                                    <span className="text-[10px] text-text-secondary mt-1">Acceso directo al chat</span>
                                                </div>
                                            </Link>
                                        )}

                                        {(!userData || (userData.role !== ROLES.AGENT && userData.role !== ROLES.AGENCY && userData.role !== ROLES.ADMIN && userData.role !== ROLES.MODERATOR)) && (
                                            <Link href="/agents/apply" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-text-primary hover:bg-brand-light hover:text-brand-primary transition-all duration-200">
                                                <span className="p-1.5 bg-brand-light rounded-sm text-brand-primary">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                                    </svg>
                                                </span>
                                                <div className="flex flex-col text-left">
                                                    <span className="font-semibold text-xs leading-none">Unirte a la red</span>
                                                    <span className="text-[10px] text-text-secondary mt-1">Aplica como experto</span>
                                                </div>
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                <Link href="/vipro-form" className="hover:text-brand-primary transition-colors duration-200">Evaluación VIPRO</Link>
                                <Link href="/about-us" className="hover:text-brand-primary transition-colors duration-200">Sobre TodoVisa</Link>
                            </div>
                        </div>

                        {/* RIGHT SECTION: Actions or Mobile Hamburger */}
                        <div className="flex items-center gap-4">
                            {/* Desktop Actions */}
                            <div className="hidden md:flex items-center">
                                {!isMounted ? (
                                    <div className="min-h-[36px] min-w-[150px]"></div>
                                ) : userData?.id ? (
                                    <div className="relative group py-2">
                                        <button className="flex flex-row items-center gap-4 cursor-pointer hover:opacity-95 transition-opacity text-left focus:outline-none">
                                            <div className="flex flex-col text-right">
                                                <span className="text-brand-dark font-bold text-sm">{userData.firstName + " " + userData.lastName}</span>
                                                <span className="text-brand-primary font-semibold text-xs">{userData.email}</span>
                                            </div>
                                            <UserAvatar
                                                src={userData.photoUrl}
                                                name={userData.firstName + " " + userData.lastName}
                                                size="md"
                                            />
                                        </button>

                                        {/* User Dropdown */}
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-border-light rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1.5 flex flex-col gap-0.5">
                                            <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-text-primary hover:bg-brand-light hover:text-brand-primary transition-all duration-200">
                                                <span className="p-1.5 bg-brand-light rounded-sm text-brand-primary">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                                    </svg>
                                                </span>
                                                <div className="flex flex-col text-left">
                                                    <span className="font-semibold text-xs leading-none">Mi perfil</span>
                                                    <span className="text-[10px] text-text-secondary mt-1">Gestiona tu cuenta y trámites</span>
                                                </div>
                                            </Link>
                                            <button
                                                onClick={async () => {
                                                    await AuthService.signOut();
                                                    useAuthStore.getState().clearUser();
                                                    window.location.href = "/";
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-status-error hover:bg-red-50 hover:text-red-700 transition-all duration-200 text-left cursor-pointer focus:outline-none"
                                            >
                                                <span className="p-1.5 bg-red-50 rounded-sm text-status-error">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                                    </svg>
                                                </span>
                                                <div className="flex flex-col text-left">
                                                    <span className="font-semibold text-xs leading-none">Cerrar sesión</span>
                                                    <span className="text-[10px] text-red-500/80 mt-1">Salir de tu cuenta segura</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-row items-center gap-4">
                                        <Link href="/auth/signin" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                                            Iniciar sesión
                                        </Link>
                                        <Link
                                            href="/auth/signup"
                                            className="bg-brand-primary text-white font-semibold px-5 py-2.5 rounded-sm flex justify-center items-center hover:bg-brand-hover transition-colors duration-200 border-none text-sm"
                                        >
                                            Comenzar
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Hamburger Toggle button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="lg:hidden flex items-center justify-center p-2 rounded-md text-text-secondary hover:text-brand-primary focus:outline-none cursor-pointer"
                                aria-label="Toggle Menu"
                            >
                                {isMenuOpen ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </nav>

                    {/* Mobile menu dropdown */}
                    {isMenuOpen && (
                        <div className="lg:hidden w-full bg-white border-t border-border-light shadow-xl absolute top-full left-0 z-40 py-6 px-6 max-h-[85vh] overflow-y-auto flex flex-col gap-6 animate-in slide-in-from-top duration-250">
                            {/* Navigation Links */}
                            <div className="flex flex-col gap-5 text-sm font-semibold text-text-secondary text-left">
                                {/* Visas Group */}
                                <div className="flex flex-col gap-2.5">
                                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Visas</span>
                                    <Link href="/visas" onClick={() => setIsMenuOpen(false)} className="hover:text-brand-primary pl-2.5 py-1 text-sm border-l border-border-light">Ver todas las visas</Link>
                                    <div className="grid grid-cols-2 gap-2 pl-2.5 mt-1">
                                        {[
                                            { code: "ca", flag: "🇨🇦", name: "Canadá" },
                                            { code: "mx", flag: "🇲🇽", name: "México" },
                                            { code: "uk", flag: "🇬🇧", name: "Inglaterra" },
                                            { code: "au", flag: "🇦🇺", name: "Australia" },
                                            { code: "in", flag: "🇮🇳", name: "India" },
                                        ].map((c) => (
                                            <Link key={c.code} href={`/visas/${c.code}`} onClick={() => setIsMenuOpen(false)} className="hover:text-brand-primary text-xs flex items-center gap-1.5 py-1">
                                                <span>{c.flag}</span> <span>{c.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                <hr className="border-border-light/60" />

                                {/* Agentes Group */}
                                <div className="flex flex-col gap-2.5">
                                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Agentes</span>
                                    <Link href="/agents" onClick={() => setIsMenuOpen(false)} className="hover:text-brand-primary pl-2.5 py-1 border-l border-border-light">Buscar expertos</Link>
                                    {userData?.hasPaidAdvisor && (
                                        <Link href="/profile?tab=asesor" onClick={() => setIsMenuOpen(false)} className="hover:text-brand-primary pl-2.5 py-1 border-l border-border-light">Mi asesor asignado</Link>
                                    )}
                                    {(!userData || (userData.role !== ROLES.AGENT && userData.role !== ROLES.AGENCY && userData.role !== ROLES.ADMIN && userData.role !== ROLES.MODERATOR)) && (
                                        <Link href="/agents/apply" onClick={() => setIsMenuOpen(false)} className="hover:text-brand-primary pl-2.5 py-1 border-l border-border-light">Unirte a la red</Link>
                                    )}

                                </div>

                                <hr className="border-border-light/60" />

                                <Link href="/vipro-form" onClick={() => setIsMenuOpen(false)} className="hover:text-brand-primary py-1">Evaluación VIPRO</Link>
                                <Link href="/about-us" onClick={() => setIsMenuOpen(false)} className="hover:text-brand-primary py-1">Sobre TodoVisa</Link>
                            </div>

                            <hr className="border-border-light/60" />

                            {/* User Authentication actions (Mobile) */}
                            <div className="flex flex-col gap-3">
                                {userData?.id ? (
                                    <>
                                        <div className="flex items-center gap-3 bg-brand-light/30 p-3 rounded-lg border border-brand-primary/10 text-left">
                                            <UserAvatar
                                                src={userData.photoUrl}
                                                name={userData.firstName + " " + userData.lastName}
                                                size="md"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-text-primary font-bold text-xs">{userData.firstName + " " + userData.lastName}</span>
                                                <span className="text-text-secondary text-[10px]">{userData.email}</span>
                                            </div>
                                        </div>
                                        <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="w-full text-center bg-brand-primary text-white font-semibold py-3 rounded-sm hover:bg-brand-hover text-sm">
                                            Mi Perfil
                                        </Link>
                                        <button
                                            onClick={async () => {
                                                setIsMenuOpen(false);
                                                await AuthService.signOut();
                                                useAuthStore.getState().clearUser();
                                                window.location.href = "/";
                                            }}
                                            className="w-full text-center border border-red-200 bg-red-50 text-red-700 font-semibold py-3 rounded-sm hover:bg-red-100 text-sm cursor-pointer"
                                        >
                                            Cerrar sesión
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/auth/signin" onClick={() => setIsMenuOpen(false)} className="w-full text-center border border-border-light py-3 rounded-sm text-sm font-semibold text-text-secondary hover:bg-background-hover">
                                            Iniciar sesión
                                        </Link>
                                        <Link href="/auth/signup" onClick={() => setIsMenuOpen(false)} className="w-full text-center bg-brand-primary text-white font-semibold py-3 rounded-sm text-sm hover:bg-brand-hover">
                                            Comenzar
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </header>
        </>
    )
}