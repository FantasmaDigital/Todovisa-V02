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
        heroDescription: "Obtén toda la información necesaria para solicitar tu visa al Reino Unido con acompañamiento experto: requisitos oficiales (UKVI), procedimiento de solicitud y guía probatoria de solvencia.",
        requiringCountries: [
            {
                region: "África",
                countries: [
                    "Argelia", "Angola", "Benín", "Botsuana", "Burkina Faso", "Burundi", "Cabo Verde",
                    "Camerún", "Egipto", "Etiopía", "Gambia", "Ghana", "Kenia", "Marruecos", "Nigeria",
                    "Senegal", "Sudáfrica", "Tanzania", "Túnez", "Uganda", "Zambia", "Zimbabue"
                ],
            },
            {
                region: "Asia",
                countries: [
                    "China", "India", "Indonesia", "Irán", "Irak", "Jordania", "Líbano", "Nepal", "Pakistán",
                    "Filipinas", "Rusia", "Tailandia", "Turquía", "Vietnam"
                ],
            },
            {
                region: "América",
                countries: [
                    "Bolivia", "Colombia", "Cuba", "Ecuador", "El Salvador", "Honduras", "Haití", "Jamaica", "República Dominicana", "Venezuela"
                ],
            },
        ],
        requirements: [
            { id: 1, title: "Pasaporte Válido con Biometría", description: "Tu pasaporte debe contar con al menos 6 meses de vigencia adicional y 2 páginas totalmente libres para estampación." },
            { id: 2, title: "Solicitud Oficial UKVI Online", description: "Llenado técnico del formulario de visado en la plataforma oficial del Gobierno Británico (Standard Visitor Visa)." },
            { id: 3, title: "Fotografía Digital Biométrica", description: "Formato pasaporte 45x35 mm con fondo blanco liso, rostro descubierto y expresión neutra." },
            { id: 4, title: "Estados de Cuenta y Solvencia", description: "Demostración de liquidez bancaria acumulada mediante extractos de los últimos 6 meses e ingresos formales comprobables." },
            { id: 5, title: "Prueba de Arraigo en País de Origen", description: "Constancia laboral firmada con antigüedad y sueldo, registro de propiedad o matrícula de estudios universitarios." },
            { id: 6, title: "Itinerario o Reserva Logística", description: "Plan detallado de estancia, reservas de hospedaje o carta de invitación formal de residente en el Reino Unido." },
        ],
        procedure: [
            { title: "1. Llenado del Formulario en Línea", description: "Completar la información personal, financiera y de viaje en el portal oficial UKVI." },
            { title: "2. Pago de Arancel Consular", description: "Pago de los aranceles de visa Standard Visitor según la duración de la estancia elegida." },
            { title: "3. Cita de Datos Biométricos (TLScontact / VFS Global)", description: "Reserva y asistencia presencial para toma de huellas dactilares y fotografía digital." },
            { title: "4. Auditoría de Documentos Digitales", description: "Carga digital de soportes probatorios al expediente británico." },
            { title: "5. Emisión y Entrega de Pasaporte", description: "Procesamiento consular y retiro o despacho por courier del pasaporte con visado." },
        ],
        additionalInfo: [
            "Para viajes de turismo o negocios de hasta 6 meses.",
            "Si posees familiares en el Reino Unido, se recomienda adjuntar carta de patrocinio o hospedaje.",
            "No se permite trabajar ni estudiar en instituciones públicas bajo esta categoría."
        ],
        sources: [
            { label: "GOV.UK - Standard Visitor visa", url: "https://www.gov.uk/standard-visitor" },
            { label: "UK Visas and Immigration Official", url: "https://www.gov.uk/apply-uk-visa" },
        ],
    },
    us: {
        code: "US",
        name: "Estados Unidos",
        flag: "/images/flag_us.png",
        flagEmoji: null,
        available: true,
        heroDescription: "Guía completa para solicitar tu visa de Turismo y Negocios a EE.UU. (B1/B2) con acompañamiento profesional: formulario DS-160, arancel MRV, preparación de expediente y entrevista consular.",
        requiringCountries: [
            {
                region: "América Latina",
                countries: [
                    "Argentina", "Bolivia", "Brasil", "Colombia", "Costa Rica", "Cuba", "Ecuador",
                    "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú", "República Dominicana", "Uruguay", "Venezuela"
                ]
            }
        ],
        requirements: [
            { id: 1, title: "Pasaporte Vigente (+6 Meses)", description: "Pasaporte original válido con una vigencia mínima de 6 meses posteriores a la fecha de regreso prevista." },
            { id: 2, title: "Hoja de Confirmación Formulario DS-160", description: "Formulario de visa de no inmigrante llenado en línea en la plataforma del Departamento de Estado (CEAC) con código de barras de 10 dígitos." },
            { id: 3, title: "Fotografía Consular 5x5 cm", description: "Foto a color reciente (menos de 6 meses), fondo blanco mate, orejas y frente descubiertas, sin lentes ni accesorios." },
            { id: 4, title: "Prueba de Solvencia Económica", description: "Estados de cuenta bancarios recientes, recibos de nómina, declaraciones de impuestos o títulos de propiedad." },
            { id: 5, title: "Prueba de Arraigo en País de Origen", description: "Constancia de trabajo con antigüedad y cargo, carné de estudiante o lazos familiares directos para superar la presunción de inmigrante (Sección 214b)." },
        ],
        procedure: [
            { title: "1. Llenado Oficial del Formulario DS-160", description: "Completar cuidadosamente todos los módulos de datos personales, familiares, laborales y antecedentes en el portal CEAC." },
            { title: "2. Creación de Cuenta y Arancel MRV", description: "Pago de la cuota oficial de solicitud de visa de no inmigrante." },
            { title: "3. Programación de Cita (CAS y Embajada)", description: "Agendamiento de cita en el Centro de Atención a Solicitantes (huellas y foto) y entrevista presencial con cónsul." },
            { title: "4. Simulacro Intensivo de Entrevista", description: "Entrenamiento virtual para preparar respuestas concisas ante las preguntas del oficial consular." },
            { title: "5. Asistencia a Cita y Retorno por Courier", description: "Presentación en el consulado y retiro o envío por courier del pasaporte visado." },
        ],
        additionalInfo: [
            "En renovaciones de visa expirada hace menos de 48 meses se puede calificar al programa de Exención de Entrevista (Interview Waiver)."
        ],
        sources: [
            { label: "US Travel State - Visa Information", url: "https://travel.state.gov/content/travel/en/us-visas.html" },
            { label: "CEAC DS-160 Online Form", url: "https://ceac.state.gov/genniv/" },
        ],
    },
    ca: {
        code: "CA",
        name: "Canadá",
        flag: "/images/flag_ca.png",
        flagEmoji: null,
        available: true,
        heroDescription: "Información oficial para solicitar la Visa de Visitante a Canadá (TRV) o la Autorización Electrónica de Viaje (eTA): requisitos de liquidez, biométricos y procesamiento IRCC.",
        requiringCountries: [
            {
                region: "América Latina",
                countries: ["Bolivia", "Colombia", "Cuba", "Ecuador", "El Salvador", "Guatemala", "Honduras", "Nicaragua", "Paraguay", "Perú", "República Dominicana", "Venezuela"]
            }
        ],
        requirements: [
            { id: 1, title: "Pasaporte Válido", description: "Pasaporte vigente con al menos 6 meses de validez y páginas libres." },
            { id: 2, title: "Solicitud IRCC Portal (IMM 5257)", description: "Completar la solicitud oficial de visa de residencia temporal en el portal IRCC Canadá." },
            { id: 3, title: "Prueba de Liquidez Bancaria", description: "Demostrar fondos económicos suficientes para financiar la estancia estimada en territorio canadiense." },
            { id: 4, title: "Toma de Biométricos (VAC)", description: "Instrucciones de recolección biométrica (huellas y foto) en el Centro de Solicitud de Visas de Canadá." },
            { id: 5, title: "Arraigo Laboral / Familiar", description: "Evidencia de empleo formal, estudio o activos inmuebles en tu país natal." }
        ],
        procedure: [
            { title: "1. Registro en Portal IRCC", description: "Crear cuenta de usuario en el portal oficial de Ciudadanía e Inmigración de Canadá." },
            { title: "2. Carga de Formularios y Soportes", description: "Subir formulario IMM 5257, pasaporte digitalizado, estados de cuenta e itinerario de viaje." },
            { title: "3. Pago de Aranceles", description: "Pago en línea de la tarifa de visa de visitante y datos biométricos." },
            { title: "4. Cita Biométrica en VFS Global", description: "Asistir al centro VAC autorizado para enrolamiento de huellas dactilares." },
            { title: "5. Envío de Pasaporte para Estampado", description: "Al recibir la carta de requerimiento de pasaporte (PPR), enviar el pasaporte físico para impresión de la viñeta." }
        ],
        additionalInfo: [
            "Ciudadanos de países exentos con visa estadounidense vigente pueden optar a la eTA Canadá.",
            "El tiempo promedio de respuesta varía según el volumen consular."
        ],
        sources: [
            { label: "Canada.ca - Visit Canada", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html" }
        ]
    },
    mx: {
        code: "MX",
        name: "México",
        flag: "/images/flag_mx.png",
        flagEmoji: null,
        available: true,
        heroDescription: "Requisitos oficiales y procedimiento para solicitar la Visa de Visitante sin Permiso para Realizar Actividades Remuneradas (Turismo/Negocios) para ingresar a México.",
        requiringCountries: [
            {
                region: "América",
                countries: ["Ecuador", "El Salvador", "Guatemala", "Honduras", "Nicaragua", "Haití", "República Dominicana", "Venezuela"]
            }
        ],
        requirements: [
            { id: 1, title: "Pasaporte Vigente", description: "Pasaporte original vigente con copia legible de la hoja de datos." },
            { id: 2, title: "Formulario Consular Impreso", description: "Formulario oficial de solicitud de visa de la Secretaría de Relaciones Exteriores de México (SRE)." },
            { id: 3, title: "Fotografía Fondo Blanco", description: "Foto a color reciente sin anteojos, de frente y rostro descubierto." },
            { id: 4, title: "Prueba de Solvencia Económica", description: "Comprobantes de ingresos mensuales netos o estados de cuenta bancarios promediados de los últimos 3 meses." },
            { id: 5, title: "Exención por Visado Vigente", description: "Personas con visa vigente de EE.UU., Canadá, Japón, Reino Unido o espacio Schengen NO requieren visa mexicana." }
        ],
        procedure: [
            { title: "1. Agendar Cita en Portal MiConsulado", description: "Registrar cuenta y agendar fecha de atención presencial en la sección consular de México." },
            { title: "2. Preparación de Expediente Físico", description: "Reunir pasaporte, formulario con fotografía pegada, estados bancarios originales y constancia laboral." },
            { title: "3. Asistencia a Cita Consular", description: "Presentarse a entrevista, toma de biometría y pago de derechos." },
            { title: "4. Resolución y Retiro de Pasaporte", description: "La visa suele entregarse el mismo día o en un plazo de pocos días hábiles." }
        ],
        additionalInfo: [
            "La visa de turista estándar mexicana permite estancias continuas de hasta 180 días.",
            "Poseer visa estadounidense o canadiense vigente exime del proceso de visa mexicana."
        ],
        sources: [
            { label: "SRE México - Visas de Visitante", url: "https://www.gob.mx/sre" }
        ]
    },
    au: {
        code: "AU",
        name: "Australia",
        flag: "/images/flag_aus.png",
        flagEmoji: null,
        available: true,
        heroDescription: "Guía completa para la solicitud de la Visa de Visitante a Australia (Subclass 600): proceso 100% digital vía ImmiAccount, solvencia y biométricos.",
        requiringCountries: [
            {
                region: "Global",
                countries: ["América Latina", "África", "Asia (excepto países exentos ETA)"]
            }
        ],
        requirements: [
            { id: 1, title: "Pasaporte Digitalizado", description: "Copia a color en alta resolución de todas las páginas con sellos o visas del pasaporte vigente." },
            { id: 2, title: "Solicitud ImmiAccount (Subclass 600)", description: "Completar la postulación online en el sistema del Department of Home Affairs de Australia." },
            { id: 3, title: "Prueba de Solvencia Financiera", description: "Estados de cuenta bancarios comprobando saldo disponible para financiar estancia estimada." },
            { id: 4, title: "Prueba de Incentivo de Retorno", description: "Cartas de empleo, estudios, propiedades o responsabilidades familiares en el país natal." }
        ],
        procedure: [
            { title: "1. Creación de ImmiAccount", description: "Abrir cuenta de usuario en el portal oficial del Departamento de Asuntos Internos de Australia." },
            { title: "2. Llenado de Formulario y Carga de PDF", description: "Responder secciones de salud, carácter e itinerario, adjuntando documentos probatorios traducidos." },
            { title: "3. Pago de Arancel Consular", description: "Pago oficial en el portal de Inmigración de Australia." },
            { title: "4. Cita Biométrica (si se requiere)", description: "Asistir a la cita de enrolamiento fotográfico y dactilar si el sistema emite carta de requerimiento." },
            { title: "5. Notificación Electrónica de Concesión (Grant Letter)", description: "La visa se vincula electrónicamente al pasaporte (no requiere viñeta física)." }
        ],
        additionalInfo: [
            "Procesamiento totalmente electrónico sin necesidad de enviar pasaporte físico por correo.",
            "Permite estancias de 3, 6 o 12 meses según la resolución del oficial de inmigración."
        ],
        sources: [
            { label: "Home Affairs Australia - Visitor Visa 600", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600" }
        ]
    },
    in: {
        code: "IN",
        name: "India",
        flag: "/images/flag_in.png",
        flagEmoji: null,
        available: true,
        heroDescription: "Procedimiento oficial para la obtención de la e-Visa de Turismo para la India (e-Tourist Visa): solicitud online de aprobación rápida y validez digital.",
        requiringCountries: [
            {
                region: "Global",
                countries: ["Nacionalidades habilitadas para e-Visa"]
            }
        ],
        requirements: [
            { id: 1, title: "Pasaporte Escaneado en PDF", description: "Página de datos del pasaporte con al menos 6 meses de vigencia y 2 páginas en blanco." },
            { id: 2, title: "Fotografía Cuadrada en JPG", description: "Foto reciente fondo blanco, tamaño mínimo 350x350 píxeles." },
            { id: 3, title: "Itinerario de Viaje o Vuelos", description: "Detalles de llegada y salida por puertos o aeropuertos autorizados en la India." }
        ],
        procedure: [
            { title: "1. Solicitud en Portal e-Visa India", description: "Completar datos de pasaporte, empleo y referencias personales." },
            { title: "2. Subida de Archivos y Foto", description: "Adjuntar PDF de pasaporte e imagen de fotografía en el formato requerido." },
            { title: "3. Pago de Tasa de Solicitud", description: "Pago oficial en línea según la duración elegida." },
            { title: "4. Recepción de ETA por Correo", description: "Aprobación electrónica (Electronic Travel Authorization) emitida en el sistema." }
        ],
        additionalInfo: [
            "La ETA debe imprimirse y presentarse a la llegada en el aeropuerto indio para el estampado del sello."
        ],
        sources: [
            { label: "Indian e-Visa Official Portal", url: "https://indianvisaonline.gov.in/evisa/" }
        ]
    },
    cn: {
        code: "CN",
        name: "China",
        flag: "/images/flag_ch.png",
        flagEmoji: null,
        available: true,
        heroDescription: "Procedimiento oficial para la obtención de la Visa L de Turismo para China: llenado del formulario COAV, agenda de citas y recopilación de requisitos.",
        requiringCountries: [
            {
                region: "Global",
                countries: ["Nacionalidades no exentas de visado para ingresar a China"]
            }
        ],
        requirements: [
            { id: 1, title: "Pasaporte Original y Copia", description: "Pasaporte con vigencia mínima de 6 meses y al menos dos páginas en blanco, junto con copia de la página de datos." },
            { id: 2, title: "Formulario COAV Confirmado", description: "Formulario de solicitud de visa completado e impreso desde el portal oficial COAV." },
            { id: 3, title: "Fotografía Reciente", description: "Foto a color reciente tamaño pasaporte con fondo blanco, rostro descubierto y sin accesorios." },
            { id: 4, title: "Itinerario o Carta de Invitación", description: "Reserva de vuelos de ida y vuelta, reservas de hotel o carta de invitación formal emitida por una entidad o residente en China." }
        ],
        procedure: [
            { title: "1. Llenado de Formulario COAV", description: "Completar el formulario de visa en línea en el portal del gobierno de China." },
            { title: "2. Agendar Cita Consular", description: "Programar fecha y hora para la entrega del expediente físico en la sección consular." },
            { title: "3. Entrega de Expediente Físico", description: "Asistir presencialmente para entregar la documentación y toma de datos biométricos." },
            { title: "4. Pago y Retiro de Visa", description: "Realizar el pago de aranceles consulares al retirar el pasaporte con la visa estampada." }
        ],
        additionalInfo: [
            "La visa de turismo estándar suele emitirse por entradas únicas, dobles o múltiples según el perfil."
        ],
        sources: [
            { label: "China Visa Application Service Center", url: "https://www.visaforchina.cn/" }
        ]
    }
};
