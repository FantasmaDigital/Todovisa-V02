export interface VisaDestination {
    code: string; // e.g. "us", "ca", "mx", "uk", "cn", "au", "in"
    name: string; // e.g. "Estados Unidos", "Canadá", "México", "Inglaterra", "China", "Australia", "India"
    flag: string; // flag emoji e.g. "🇺🇸", "🇨🇦"
    flagImage: string; // image path e.g. "/images/flag_us.png"
    type: string; // e.g. "Visa B1/B2 (Turismo / Negocios)"
    description: string; // Short summary
    enabled: boolean; // true = active, false = PRONTO (disabled)
    badge: string; // e.g. "Más Solicitada"
    aboutDesc?: string; // Optional short description for About Us page
}

export const visaDestinations: VisaDestination[] = [
    {
        code: "us",
        name: "Estados Unidos",
        flag: "🇺🇸",
        flagImage: "/images/flag_us.png",
        type: "Visa B1/B2 (Turismo / Negocios)",
        description: "Requisitos de solvencia, llenado técnico de formulario DS-160, arancel de $185 USD y preparación de entrevista consular presencial.",
        enabled: true, // Activated
        badge: "Más Solicitada",
        aboutDesc: "Visas B1/B2 de turismo/negocios, visas de estudiante F1 y Exención de Entrevista (Drop Box)."
    },
    {
        code: "ca",
        name: "Canadá",
        flag: "🇨🇦",
        flagImage: "/images/flag_ca.png",
        type: "Visa de Visitante (TRV) / eTA",
        description: "Postulación mediante portal IRCC, enrolamiento de datos biométricos VAC ($185 CAD) y envío de pasaporte para estampado.",
        enabled: true,
        badge: "Alta Aprobación",
        aboutDesc: "Visas de visitante e itinerarios de estudio/trabajo mediante la plataforma IRCC."
    },
    {
        code: "mx",
        name: "México",
        flag: "🇲🇽",
        flagImage: "/images/flag_mx.png",
        type: "Visa de Visitante sin Permiso Laboral",
        description: "Atención por cita en MiConsulado, exención con visa estadounidense o canadiense vigente y estancia de hasta 180 días.",
        enabled: true,
        badge: "Cita Presencial",
        aboutDesc: "Visas de visitante y procesos consulares con acompañamiento integral."
    },
    {
        code: "uk",
        name: "Inglaterra",
        flag: "🇬🇧",
        flagImage: "/images/flag_uk.png",
        type: "Standard Visitor Visa",
        description: "Solicitud online UKVI, arancel de £115 GBP, comprobante de liquidez bancaria de 6 meses y toma de biométricos.",
        enabled: true,
        badge: "Proceso Online",
        aboutDesc: "Standard Visitor Visa y asesoría para solicitudes oficiales ante la UKVI."
    },
    {
        code: "cn",
        name: "China",
        flag: "🇨🇳",
        flagImage: "/images/flag_ch.png",
        type: "Visa L (Turismo)",
        description: "Formulario COAV, carta de invitación formal de agencia o residente y atención consular previa cita.",
        enabled: true, // Activated
        badge: "Próximamente",
        aboutDesc: "Visa L de turismo, formulario COAV y agenda de citas consulares."
    },
    {
        code: "au",
        name: "Australia",
        flag: "🇦🇺",
        flagImage: "/images/flag_aus.png",
        type: "Visitor Visa (Subclass 600)",
        description: "Proceso 100% digital a través de ImmiAccount ($190 AUD), vinculación electrónica al pasaporte sin viñeta física.",
        enabled: true,
        badge: "100% Digital",
        aboutDesc: "Visados de turismo Subclass 600 y procesamiento digital vía ImmiAccount."
    },
    {
        code: "in",
        name: "India",
        flag: "🇮🇳",
        flagImage: "/images/flag_in.png",
        type: "e-Tourist Visa (ETA)",
        description: "Autorización de viaje electrónica expedida en 72 horas para estancias de turismo, negocios o tratamientos médicos.",
        enabled: true,
        badge: "Procesamiento Express",
        aboutDesc: "e-Tourist Visa (ETA) electrónica con aprobación rápida en 72 horas."
    }
];

export const agentTargetCountries = [
    "Estados Unidos",
    "Canadá",
    "México",
    "Reino Unido",
    "Australia",
    "España",
    "China",
    "India",
    "Otro"
];

/**
 * Returns active visa destinations from localStorage (synced with DB system_settings)
 * or falls back to standard visaDestinations list.
 */
export function getCentralizedDestinations(): VisaDestination[] {
    if (typeof window !== "undefined") {
        const stored = localStorage.getItem("visa_destinations");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map((item: any) => {
                        const match = visaDestinations.find(d => d.code === item.code || d.name === item.name);
                        return {
                            ...match,
                            ...item
                        };
                    });
                }
            } catch (e) {}
        }
    }
    return visaDestinations;
}

/**
 * Returns list of country names for selection forms (e.g. Agent Application, Citas, etc.)
 */
export function getDestinationCountryNames(): string[] {
    return agentTargetCountries;
}
