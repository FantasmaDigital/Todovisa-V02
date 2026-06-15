export type RequiringCountry = {
    region: string;
    countries: string[];
};

export type VisaRequirement = {
    id: number;
    title: string;
    description: string;
};

export type VisaProcedureStep = {
    title: string;
    description: string;
};

export type CountryVisaInfo = {
    code: string;
    name: string;
    flag: string | null;
    flagEmoji: string | null;
    available: boolean;
    heroDescription: string;
    requiringCountries: RequiringCountry[];
    requirements: VisaRequirement[];
    procedure: VisaProcedureStep[];
    additionalInfo: string[];
    sources: { label: string; url: string }[];
};

export const countryVisaData: Record<string, CountryVisaInfo> = {
    uk: {
        code: "UK",
        name: "Inglaterra (Reino Unido)",
        flag: "/images/flag_uk.png",
        flagEmoji: null,
        available: true,
        heroDescription: "Obtén toda la información necesaria para tramitar tu visa al Reino Unido: requisitos, procedimiento, documentos y países que la requieren.",
        requiringCountries: [
            {
                region: "África",
                countries: [
                    "Argelia", "Angola", "Benín", "Botsuana", "Burkina Faso", "Burundi", "Cabo Verde",
                    "Camerún", "República Centroafricana", "Chad", "Comoras", "Congo (República)",
                    "Congo (República Democrática)", "Costa de Marfil", "Djibouti", "Egipto",
                    "Guinea Ecuatorial", "Eritrea", "Etiopía", "Gabón", "Gambia", "Ghana", "Guinea",
                    "Guinea-Bisáu", "Kenia", "Lesoto", "Liberia", "Libia", "Madagascar", "Malaui",
                    "Malí", "Mauritania", "Mozambique", "Namibia", "Níger", "Nigeria", "Ruanda",
                    "Santo Tomé y Príncipe", "Senegal", "Sierra Leona", "Somalia", "Sudán",
                    "Sudán del Sur", "Swazilandia", "Tanzania", "Togo", "Túnez", "Uganda", "Zambia", "Zimbabue"
                ],
            },
            {
                region: "Asia",
                countries: [
                    "Afganistán", "Armenia", "Azerbaiyán", "Bahréin", "Bangladesh", "Bután", "Brunei",
                    "Camboya", "China", "Georgia", "India", "Indonesia", "Irán", "Irak", "Jordania",
                    "Kazajistán", "Corea del Norte", "Kuwait", "Kirguistán", "Laos", "Líbano",
                    "Malasia", "Maldivas", "Mongolia", "Myanmar (Birmania)", "Nepal", "Omán", "Pakistán",
                    "Palestina", "Filipinas", "Catar", "Rusia", "Arabia Saudita", "Singapur", "Sri Lanka",
                    "Siria", "Tayikistán", "Tailandia", "Timor Oriental", "Turquía", "Turkmenistán",
                    "Emiratos Árabes Unidos", "Uzbekistán", "Vietnam", "Yemen"
                ],
            },
            {
                region: "Europa",
                countries: [
                    "Albania", "Bielorrusia", "Bosnia y Herzegovina", "Kosovo",
                    "Macedonia del Norte", "Moldavia", "Montenegro", "Serbia", "Ucrania"
                ],
            },
            {
                region: "América",
                countries: [
                    "Antigua y Barbuda", "Argentina", "Bahamas", "Barbados", "Belice", "Bolivia",
                    "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba", "Dominica", "Ecuador",
                    "El Salvador", "Granada", "Guatemala", "Guyana", "Haití", "Honduras", "Jamaica",
                    "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "República Dominicana",
                    "San Cristóbal y Nieves", "Santa Lucía", "San Vicente y las Granadinas",
                    "Surinam", "Trinidad y Tobago", "Uruguay", "Venezuela"
                ],
            },
            {
                region: "Oceanía",
                countries: [
                    "Fiyi", "Kiribati", "Islas Marshall", "Micronesia", "Nauru", "Palau",
                    "Papúa Nueva Guinea", "Samoa", "Islas Salomón", "Tonga", "Tuvalu", "Vanuatu"
                ],
            },
        ],
        requirements: [
            { id: 1, title: "Pasaporte Válido", description: "Tu pasaporte debe ser válido durante todo el período de tu estancia en el Reino Unido." },
            { id: 2, title: "Formulario de Solicitud Completo", description: "Debes completar el formulario de solicitud en línea disponible en el sitio web del gobierno del Reino Unido." },
            { id: 3, title: "Fotografía Reciente", description: "Una fotografía reciente en formato de pasaporte." },
            { id: 4, title: "Prueba de Fondos", description: "Debes demostrar que tienes suficientes fondos para mantenerte durante tu estancia sin necesidad de trabajar o acceder a fondos públicos. Esto puede incluir extractos bancarios, recibos de sueldo o pruebas de ingresos de otras fuentes." },
            { id: 5, title: "Prueba de Propósito de Visita", description: "Documentación que respalde el propósito de tu visita, como una carta de invitación, itinerario de viaje, reservas de hotel, etc." },
            { id: 6, title: "Prueba de Vínculos con el País de Residencia", description: "Para demostrar que tienes razones para regresar a tu país de origen. Esto puede incluir pruebas de empleo, estudios, o lazos familiares." },
            { id: 7, title: "Prueba de Residencia y Estado Migratorio", description: "Si no eres ciudadano del país desde el que estás aplicando, necesitas demostrar tu estatus migratorio en dicho país." },
        ],
        procedure: [
            { title: "Completar el Formulario en Línea", description: "Accede al sistema de solicitud de visas del Reino Unido y completa el formulario correspondiente." },
            { title: "Pagar la Tarifa de Solicitud", description: "La tarifa de la visa de visitante varía según la duración de la estancia. La tarifa estándar para una visa de turista de seis meses es de £100 (aproximadamente $130 USD)." },
            { title: "Reservar una Cita Biométrica", description: "Una vez completado el formulario y pagada la tarifa, debes reservar una cita en el centro de solicitud de visas más cercano para proporcionar tus datos biométricos (huellas dactilares y fotografía)." },
            { title: "Presentar Documentos de Apoyo", description: "En tu cita, lleva todos los documentos requeridos: pasaporte, confirmación de cita y cualquier otra documentación solicitada." },
            { title: "Entrevista (si aplica)", description: "En algunos casos puede ser necesaria una entrevista para evaluar tu solicitud." },
            { title: "Esperar la Decisión", description: "Una vez presentada tu solicitud y documentos, deberás esperar la decisión. Los tiempos de procesamiento generalmente toman unas pocas semanas." },
        ],
        additionalInfo: [
            "Dependiendo de tu situación personal y la naturaleza de tu visita, es posible que necesites proveer evidencia adicional.",
            "Si estás visitando a familiares o amigos, una carta de invitación puede ser útil.",
            "Para viajes de negocios, deberás proporcionar una carta de tu empleador y una invitación de la empresa en el Reino Unido.",
        ],
        sources: [
            { label: "GOV.UK - Apply for a UK visa", url: "https://www.gov.uk/apply-uk-visa" },
            { label: "GOV.UK - Standard Visitor visa", url: "https://www.gov.uk/standard-visitor" },
        ],
    },
    us: {
        code: "US",
        name: "Estados Unidos",
        flag: "/images/flag_us.png",
        flagEmoji: null,
        available: true,
        heroDescription: "Información completa para tramitar tu visa a Estados Unidos: requisitos, procedimiento de solicitud y documentación necesaria.",
        requiringCountries: [],
        requirements: [
            { id: 1, title: "Pasaporte Válido", description: "Debe tener validez mínima de 6 meses más allá de la fecha de salida prevista de EE.UU." },
            { id: 2, title: "Formulario DS-160", description: "Completar el formulario de solicitud de visa de no inmigrante en línea." },
            { id: 3, title: "Fotografía Reciente", description: "Una foto reciente en formato pasaporte cumpliendo los requisitos del Departamento de Estado." },
            { id: 4, title: "Prueba de Fondos Suficientes", description: "Estados de cuenta bancarios o comprobantes de ingresos que demuestren capacidad económica para el viaje." },
            { id: 5, title: "Prueba de Arraigo", description: "Documentos que demuestren vínculos fuertes con tu país de origen: empleo, propiedad, familia." },
        ],
        procedure: [
            { title: "Completar el Formulario DS-160", description: "Rellena el formulario en línea en el sitio del Departamento de Estado de EE.UU." },
            { title: "Pagar la Tarifa MRV", description: "La tarifa de solicitud de visa B1/B2 es de $185 USD." },
            { title: "Agendar Cita Consular", description: "Reserva tu cita en el consulado o embajada de EE.UU. más cercana." },
            { title: "Asistir a la Entrevista", description: "Presenta tus documentos y responde las preguntas del oficial consular." },
            { title: "Esperar la Decisión", description: "El tiempo de procesamiento varía. Recibirás tu pasaporte con la visa si es aprobada." },
        ],
        additionalInfo: [
            "Los tiempos de espera para citas consulares pueden variar significativamente según la embajada.",
            "Llevar toda la documentación de soporte organizada y ordenada para la entrevista.",
        ],
        sources: [
            { label: "travel.state.gov - Visa Application", url: "https://travel.state.gov/content/travel/en/us-visas.html" },
        ],
    },
};
