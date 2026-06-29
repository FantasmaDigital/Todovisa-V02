// --- INTERFACES ---

export type VIPROQuestionsProps = {
    question: string;
    type_question: string;
    response: string[];
    user_response: string;
    category: string;
    required?: boolean;
}

export type VIPROInfoProps = {
    info_text: string;
    category: string;
}

// --- ARRAY DE PREGUNTAS (INTERACTIVO) ---

export const VIPROQuestionsUSA: VIPROQuestionsProps[] = [
    // SECCIÓN A.1
    { question: "Apellido(s) según pasaporte (Last Name):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.1 DATOS DE IDENTIDAD" },
    { question: "Nombre(s) según pasaporte (First & Middle Name):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.1 DATOS DE IDENTIDAD" },
    { question: "¿Tiene otros apellidos, alias o nombre de soltera?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - A.1 DATOS DE IDENTIDAD" },
    { question: "Si es sí, indique:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.1 DATOS DE IDENTIDAD", required: false },
    { question: "Fecha de nacimiento (DD/MM/AAAA):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.1 DATOS DE IDENTIDAD" },
    { question: "Ciudad de nacimiento (City of Birth):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.1 DATOS DE IDENTIDAD" },
    { question: "Estado / Departamento de nacimiento:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.1 DATOS DE IDENTIDAD" },
    { question: "País de nacimiento (Country of Birth):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.1 DATOS DE IDENTIDAD" },
    { question: "Género (Gender):", type_question: "opcion multiple", response: ["Masculino / Male", "Femenino / Female"], user_response: "", category: "USA - A.1 DATOS DE IDENTIDAD" },
    { question: "País de ciudadanía principal (Country of Citizenship):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.1 DATOS DE IDENTIDAD" },
    { question: "¿Tiene otra ciudadanía o nacionalidad?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - A.1 DATOS DE IDENTIDAD" },
    { question: "Si es sí, indique cuál:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.1 DATOS DE IDENTIDAD", required: false },
    { question: "Número de Identificación Nacional (DUI / Cédula / DNI):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.1 DATOS DE IDENTIDAD" },
    { question: "Número de Seguro Social de EE.UU. (si aplica):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.1 DATOS DE IDENTIDAD", required: false },
    { question: "Número de Identificación Tributaria EE.UU. (U.S. Taxpayer ID, si aplica):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.1 DATOS DE IDENTIDAD", required: false },

    // SECCIÓN A.2
    { question: "Número de pasaporte:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.2 DATOS DEL PASAPORTE" },
    { question: "Tipo de pasaporte:", type_question: "opcion multiple", response: ["Ordinario / Regular", "Oficial", "Diplomático", "Pasaporte emergencia", "Otro"], user_response: "", category: "USA - A.2 DATOS DEL PASAPORTE" },
    { question: "País que emitió el pasaporte:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.2 DATOS DEL PASAPORTE" },
    { question: "Fecha de expedición (DD/MM/AAAA):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.2 DATOS DEL PASAPORTE" },
    { question: "Fecha de vencimiento (DD/MM/AAAA):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.2 DATOS DEL PASAPORTE" },
    { question: "Ciudad / País donde fue emitido:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.2 DATOS DEL PASAPORTE" },
    { question: "¿Ha perdido o le han robado algún pasaporte?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - A.2 DATOS DEL PASAPORTE" },
    { question: "Si es sí, número y año aproximado:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.2 DATOS DEL PASAPORTE", required: false },

    // SECCIÓN A.3
    { question: "Dirección residencial completa (no usar P.O. Box):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.3 INFORMACIÓN DE CONTACTO" },
    { question: "Ciudad de residencia:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.3 INFORMACIÓN DE CONTACTO" },
    { question: "Estado / Departamento / Provincia:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.3 INFORMACIÓN DE CONTACTO" },
    { question: "País de residencia actual:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.3 INFORMACIÓN DE CONTACTO" },
    { question: "Código postal:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.3 INFORMACIÓN DE CONTACTO" },
    { question: "¿Esta dirección es también su domicilio?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - A.3 INFORMACIÓN DE CONTACTO" },
    { question: "Si no, indique dirección de domicilio:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.3 INFORMACIÓN DE CONTACTO", required: false },
    { question: "Teléfono celular principal (con código de país):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.3 INFORMACIÓN DE CONTACTO" },
    { question: "Teléfono fijo (con código de país):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.3 INFORMACIÓN DE CONTACTO", required: false },
    { question: "Teléfono de trabajo:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.3 INFORMACIÓN DE CONTACTO", required: false },
    { question: "Correo electrónico principal:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.3 INFORMACIÓN DE CONTACTO" },
    { question: "Correo electrónico alternativo:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.3 INFORMACIÓN DE CONTACTO", required: false },
    { question: "Perfil de redes sociales (indique plataforma y usuario, ej. Twitter: @usuario):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.3 INFORMACIÓN DE CONTACTO", required: false },

    // SECCIÓN A.4
    { question: "Estado civil:", type_question: "opcion multiple", response: ["Soltero/a", "Casado/a", "Unión libre", "Separado/a", "Divorciado/a", "Viudo/a"], user_response: "", category: "USA - A.4 ESTADO CIVIL Y FAMILIA" },
    { question: "Nombre completo del cónyuge / pareja:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.4 ESTADO CIVIL Y FAMILIA", required: false },
    { question: "Fecha de nacimiento del cónyuge:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.4 ESTADO CIVIL Y FAMILIA", required: false },
    { question: "País de nacimiento del cónyuge:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.4 ESTADO CIVIL Y FAMILIA", required: false },
    { question: "Ciudadanía del cónyuge:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.4 ESTADO CIVIL Y FAMILIA", required: false },
    { question: "País de residencia del cónyuge:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.4 ESTADO CIVIL Y FAMILIA", required: false },
    { question: "¿Su cónyuge / pareja viaja con usted?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - A.4 ESTADO CIVIL Y FAMILIA", required: false },
    { question: "Fecha de matrimonio / inicio de unión:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.4 ESTADO CIVIL Y FAMILIA", required: false },
    { question: "Lugar del matrimonio (ciudad, país):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.4 ESTADO CIVIL Y FAMILIA", required: false },
    { question: "Si está divorciado/a, fecha del divorcio:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.4 ESTADO CIVIL Y FAMILIA", required: false },
    { question: "Número de hijos (incluyendo adoptivos y dependientes):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.4 ESTADO CIVIL Y FAMILIA", required: false },

    // SECCIÓN A.5
    { question: "Nombre completo del padre (tal como aparece en su pasaporte o acta):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.5 INFORMACIÓN DE LOS PADRES" },
    { question: "Fecha de nacimiento del padre:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.5 INFORMACIÓN DE LOS PADRES" },
    { question: "País de nacimiento del padre:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.5 INFORMACIÓN DE LOS PADRES" },
    { question: "¿Su padre es ciudadano o residente de EE.UU.?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - A.5 INFORMACIÓN DE LOS PADRES" },
    { question: "¿Vive su padre actualmente?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - A.5 INFORMACIÓN DE LOS PADRES" },
    { question: "Nombre completo de la madre:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.5 INFORMACIÓN DE LOS PADRES" },
    { question: "Fecha de nacimiento de la madre:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.5 INFORMACIÓN DE LOS PADRES" },
    { question: "País de nacimiento de la madre:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.5 INFORMACIÓN DE LOS PADRES" },
    { question: "¿Su madre es ciudadana o residente de EE.UU.?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - A.5 INFORMACIÓN DE LOS PADRES" },
    { question: "¿Vive su madre actualmente?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - A.5 INFORMACIÓN DE LOS PADRES" },

    // SECCIÓN A.6
    { question: "¿Tiene familiares en EE.UU. (ciudadanos, residentes o con visa)?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - A.6 FAMILIARES EN EE.UU." },
    { question: "Si es sí, nombre completo del familiar:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.6 FAMILIARES EN EE.UU.", required: false },
    { question: "Relación con usted (padre, hijo, hermano, tío, etc.):", type_question: "abierta", response: [""], user_response: "", category: "USA - A.6 FAMILIARES EN EE.UU.", required: false },
    { question: "Estatus migratorio del familiar en EE.UU.:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.6 FAMILIARES EN EE.UU.", required: false },
    { question: "Ciudad y estado donde reside el familiar:", type_question: "abierta", response: [""], user_response: "", category: "USA - A.6 FAMILIARES EN EE.UU.", required: false },

    // SECCIÓN B.1
    { question: "Ocupación actual (Primary Occupation):", type_question: "opcion multiple", response: ["Empleado sector privado", "Empleado sector público", "Trabajador independiente", "Empresario / propietario", "Estudiante", "Ama/o de casa", "Desempleado", "Jubilado / Pensionado", "Otro"], user_response: "", category: "USA - B.1 SITUACIÓN LABORAL" },
    { question: "Nombre del empleador / empresa / institución:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.1 SITUACIÓN LABORAL" },
    { question: "Cargo o puesto que desempeña:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.1 SITUACIÓN LABORAL" },
    { question: "Dirección completa del empleador:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.1 SITUACIÓN LABORAL" },
    { question: "Teléfono del empleador:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.1 SITUACIÓN LABORAL" },
    { question: "Fecha de inicio en el cargo actual:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.1 SITUACIÓN LABORAL" },
    { question: "Descripción breve de sus funciones:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.1 SITUACIÓN LABORAL" },
    { question: "Nombre y cargo de su supervisor inmediato:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.1 SITUACIÓN LABORAL" },

    // SECCIÓN B.2
    { question: "Historial Laboral / Educativo (últimos 5 años). Indique Empleador/Institución, Cargo/Actividad, País, Desde y Hasta para cada registro:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.2 HISTORIAL LABORAL", required: false },

    // SECCIÓN B.3
    { question: "Nivel educativo más alto alcanzado:", type_question: "opcion multiple", response: ["Sin estudios", "Primaria", "Secundaria / Bachillerato", "Técnico / Vocacional", "Universitario", "Posgrado (maestría/doctorado)"], user_response: "", category: "USA - B.3 EDUCACIÓN" },
    { question: "Nombre de la institución educativa principal:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.3 EDUCACIÓN" },
    { question: "Ciudad y País de la institución:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.3 EDUCACIÓN" },
    { question: "Año de graduación o último año cursado:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.3 EDUCACIÓN" },
    { question: "Título o certificado obtenido:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.3 EDUCACIÓN" },
    { question: "¿Estudia actualmente?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - B.3 EDUCACIÓN" },
    { question: "Si estudia: institución, carrera y nivel actual:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.3 EDUCACIÓN", required: false },

    // SECCIÓN B.4
    { question: "Ingreso mensual neto (en USD o moneda local equivalente):", type_question: "abierta", response: [""], user_response: "", category: "USA - B.4 SITUACIÓN FINANCIERA" },
    { question: "Nombre del banco principal:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.4 SITUACIÓN FINANCIERA" },
    { question: "Saldo promedio últimos 3 meses (USD aprox.):", type_question: "abierta", response: [""], user_response: "", category: "USA - B.4 SITUACIÓN FINANCIERA" },
    { question: "¿Posee bienes inmuebles?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - B.4 SITUACIÓN FINANCIERA" },
    { question: "Descripción de bienes inmuebles:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.4 SITUACIÓN FINANCIERA", required: false },
    { question: "¿Posee vehículos?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - B.4 SITUACIÓN FINANCIERA" },
    { question: "Descripción de vehículos:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.4 SITUACIÓN FINANCIERA", required: false },
    { question: "Otros activos, negocios o inversiones:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.4 SITUACIÓN FINANCIERA", required: false },
    { question: "¿Quién financia este viaje?", type_question: "opcion multiple", response: ["Yo mismo/a", "Mi empleador", "Familiar", "Patrocinador externo"], user_response: "", category: "USA - B.4 SITUACIÓN FINANCIERA" },
    { question: "Nombre del patrocinador / persona que costea el viaje:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.4 SITUACIÓN FINANCIERA", required: false },
    { question: "Relación con el patrocinador:", type_question: "abierta", response: [""], user_response: "", category: "USA - B.4 SITUACIÓN FINANCIERA", required: false },
    { question: "Monto total estimado disponible para el viaje (USD):", type_question: "abierta", response: [""], user_response: "", category: "USA - B.4 SITUACIÓN FINANCIERA" },

    // SECCIÓN C.1
    { question: "Tipo de visa solicitada:", type_question: "opcion multiple", response: ["B1/B2 — Turismo y Negocios", "B1 — Negocios únicamente", "B2 — Turismo / Médica / Familiar", "F1 — Estudiante", "J1 — Intercambio", "C — Tránsito", "Otro tipo"], user_response: "", category: "USA - C.1 DETALLES VISA" },
    { question: "Si solicitó otro tipo, especifique:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.1 DETALLES VISA", required: false },
    { question: "Número de visas / entradas:", type_question: "opcion multiple", response: ["Entrada única", "Entradas múltiples"], user_response: "", category: "USA - C.1 DETALLES VISA" },
    { question: "Propósito principal del viaje (sea específico):", type_question: "abierta", response: [""], user_response: "", category: "USA - C.1 DETALLES VISA" },
    { question: "Fecha de llegada prevista a EE.UU. (DD/MM/AAAA):", type_question: "abierta", response: [""], user_response: "", category: "USA - C.1 DETALLES VISA" },
    { question: "Fecha de salida prevista de EE.UU. (DD/MM/AAAA):", type_question: "abierta", response: [""], user_response: "", category: "USA - C.1 DETALLES VISA" },
    { question: "Duración estimada de la estadía (días):", type_question: "abierta", response: [""], user_response: "", category: "USA - C.1 DETALLES VISA" },
    { question: "Estado(s) y ciudad(es) que planea visitar:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.1 DETALLES VISA" },
    { question: "Puerto de entrada (aeropuerto o paso fronterizo):", type_question: "abierta", response: [""], user_response: "", category: "USA - C.1 DETALLES VISA" },

    // SECCIÓN C.2
    { question: "Tipo de hospedaje:", type_question: "opcion multiple", response: ["Hotel", "Casa de familiar", "Casa de amigo", "Airbnb / alquiler", "Trabajo / empresa", "Otro"], user_response: "", category: "USA - C.2 HOSPEDAJE" },
    { question: "Nombre y/o dirección del hospedaje principal:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.2 HOSPEDAJE" },
    { question: "Teléfono del hospedaje o contacto:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.2 HOSPEDAJE" },
    { question: "Ciudad y estado del hospedaje:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.2 HOSPEDAJE" },
    { question: "Nombre de quien lo recibirá (si aplica):", type_question: "abierta", response: [""], user_response: "", category: "USA - C.2 HOSPEDAJE" },
    { question: "Relación con quien lo recibirá:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.2 HOSPEDAJE" },

    // SECCIÓN C.3
    { question: "¿Quién paga los gastos del viaje?", type_question: "opcion multiple", response: ["El propio solicitante", "Otra persona", "Una empresa u organización"], user_response: "", category: "USA - C.3 FINANCIAMIENTO DEL VIAJE" },
    { question: "Nombre completo de quien paga:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.3 FINANCIAMIENTO DEL VIAJE" },
    { question: "Teléfono de quien paga:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.3 FINANCIAMIENTO DEL VIAJE" },
    { question: "Dirección de quien paga:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.3 FINANCIAMIENTO DEL VIAJE" },
    { question: "Relación con usted:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.3 FINANCIAMIENTO DEL VIAJE" },

    // SECCIÓN C.4
    { question: "¿Ha viajado a EE.UU. anteriormente?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - C.4 HISTORIAL VIAJES EE.UU." },
    { question: "Si es sí, fecha de la última visita (DD/MM/AAAA):", type_question: "abierta", response: [""], user_response: "", category: "USA - C.4 HISTORIAL VIAJES EE.UU.", required: false },
    { question: "Duración de la última estadía:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.4 HISTORIAL VIAJES EE.UU.", required: false },
    { question: "Número de veces que ha visitado EE.UU. en los últimos 5 años:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.4 HISTORIAL VIAJES EE.UU.", required: false },
    { question: "¿Ha tenido visa de EE.UU. antes?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - C.4 HISTORIAL VIAJES EE.UU." },
    { question: "Si es sí, número de visa anterior:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.4 HISTORIAL VIAJES EE.UU.", required: false },
    { question: "Tipo de visa que tenía:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.4 HISTORIAL VIAJES EE.UU.", required: false },
    { question: "Fecha de vencimiento de la visa anterior:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.4 HISTORIAL VIAJES EE.UU.", required: false },
    { question: "¿Le fue negada una visa de EE.UU. alguna vez?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - C.4 HISTORIAL VIAJES EE.UU." },
    { question: "Si es sí, año del rechazo y razón indicada:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.4 HISTORIAL VIAJES EE.UU.", required: false },
    { question: "¿Le ha sido cancelada o revocada alguna visa de EE.UU.?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - C.4 HISTORIAL VIAJES EE.UU." },
    { question: "Si es sí, cuándo y por qué:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.4 HISTORIAL VIAJES EE.UU.", required: false },
    { question: "¿Alguna vez fue admitido/a a EE.UU. con visa de inmigrante?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - C.4 HISTORIAL VIAJES EE.UU." },

    // SECCIÓN C.5
    { question: "Historial de Viajes Internacionales (últimos 5 años). Indique: País visitado, Fecha entrada, Fecha salida, Propósito:", type_question: "abierta", response: [""], user_response: "", category: "USA - C.5 VIAJES INTERNACIONALES" },

    // SECCIÓN D
    { question: "Nombre completo del contacto en EE.UU.:", type_question: "abierta", response: [""], user_response: "", category: "USA - D CONTACTO EN EE.UU." },
    { question: "Relación con usted:", type_question: "abierta", response: [""], user_response: "", category: "USA - D CONTACTO EN EE.UU." },
    { question: "Dirección completa del contacto:", type_question: "abierta", response: [""], user_response: "", category: "USA - D CONTACTO EN EE.UU." },
    { question: "Ciudad y estado del contacto:", type_question: "abierta", response: [""], user_response: "", category: "USA - D CONTACTO EN EE.UU." },
    { question: "Teléfono del contacto:", type_question: "abierta", response: [""], user_response: "", category: "USA - D CONTACTO EN EE.UU." },
    { question: "Correo electrónico del contacto:", type_question: "abierta", response: [""], user_response: "", category: "USA - D CONTACTO EN EE.UU." },
    { question: "Estatus migratorio del contacto en EE.UU. (ciudadano, residente, visa, etc.):", type_question: "abierta", response: [""], user_response: "", category: "USA - D CONTACTO EN EE.UU." },

    // SECCIÓN E
    { question: "E.1 ¿Tiene alguna enfermedad física o mental que pueda representar un riesgo para usted mismo u otros?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.2 ¿Es o fue adicto/a a drogas o sustancias controladas?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.3 ¿Tiene o ha tenido algún trastorno que afecte su comportamiento (incluyendo trastornos de personalidad que puedan ser una amenaza para la propiedad, seguridad o bienestar de sí mismo u otros)?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "Si respondió Sí a E.1, E.2 o E.3, explique brevemente:", type_question: "abierta", response: [""], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD", required: false },
    { question: "E.4 ¿Ha sido arrestado o condenado por algún delito en cualquier país (aunque haya sido perdonado, sobreseído o la pena haya sido cumplida)?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "Si es sí, país, tipo de delito, año y sentencia:", type_question: "abierta", response: [""], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD", required: false },
    { question: "E.5 ¿Ha violado leyes sobre sustancias controladas (narcóticos, marihuana, cocaína, etc.) en cualquier país?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.6 ¿Se ha prostituido o ha intentado obtener o proporcionar servicios de prostitución en los últimos 10 años?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.7 ¿Ha participado en lavado de dinero?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.8 ¿Ha cometido o conspirado para cometer fraude fiscal o evasión de impuestos?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.9 ¿Alguna vez ha sido miembro o representante de una organización terrorista?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.10 ¿Alguna vez ha financiado, apoyado o patrocinado actividades terroristas?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.11 ¿Ha proporcionado a alguna organización terrorista cualquier tipo de asistencia (incluyendo entrenamiento, armas, fondos, refugio o comunicaciones)?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.12 ¿Ha cometido o planificado actos de terrorismo?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.13 ¿Ha recibido entrenamiento paramilitar?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.14 ¿Usted o algún miembro de su familia pertenece o ha pertenecido a grupos terroristas designados?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "Si respondió Sí a cualquier pregunta de la parte de Terrorismo, especifique:", type_question: "abierta", response: [""], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD", required: false },
    { question: "E.15 ¿Ha participado en genocidio, tortura, persecución extrajudicial o crímenes de lesa humanidad?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.16 ¿Entre 1933 y 1945 trabajó o colaboró de alguna forma con el gobierno Nazi de Alemania o sus aliados?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.17 ¿Ha participado en el reclutamiento o uso de niños soldados?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.18 ¿Ha participado en crímenes de guerra o violaciones graves del derecho internacional humanitario?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "Si respondió Sí a alguna pregunta de la parte de Persecución y Crímenes, especifique:", type_question: "abierta", response: [""], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD", required: false },
    { question: "E.19 ¿Ha sido deportado, removido o expulsado de EE.UU. alguna vez?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "Si es sí, fecha y circunstancias:", type_question: "abierta", response: [""], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD", required: false },
    { question: "E.20 ¿Ha excedido la estadía autorizada (overstay) en EE.UU. en alguna ocasión?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "Si es sí, cuándo y por cuánto tiempo:", type_question: "abierta", response: [""], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD", required: false },
    { question: "E.21 ¿Ha intentado obtener una visa de EE.UU. mediante fraude, documentación falsa o identidad falsa?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.22 ¿Ha ingresado o intentado ingresar a EE.UU. sin visa o sin inspección?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.23 ¿Ha solicitado asilo en EE.UU. o cualquier otro país?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "Si es sí, indique país y resultado:", type_question: "abierta", response: [""], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD", required: false },
    { question: "E.24 ¿Ha sido parte de un proceso de deportación, exclusión o remoción ante las autoridades migratorias de EE.UU.?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.25 ¿Ha trabajado, estudiado o entrenado en el ámbito de armas biológicas, químicas, nucleares o radiológicas?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.26 ¿Tiene conocimiento sobre la fabricación, adquisición o uso de armas de destrucción masiva?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.27 ¿Ha sido empleado por una organización de inteligencia o seguridad de cualquier gobierno?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "Si es sí, indique cuál y en qué capacidad:", type_question: "abierta", response: [""], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD", required: false },
    { question: "E.28 ¿Ha participado en vigilancia, seguimiento o represión de individuos por razones políticas, religiosas o étnicas?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.29 ¿Ha traficado con personas, facilitado trata de personas o se ha beneficiado de la trata de personas?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "E.30 ¿Es pariente de alguien involucrado en tráfico de personas o lo ha ayudado en los últimos 5 años?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { question: "Si respondió Sí a cualquier pregunta de estas Otras Preguntas de Seguridad, explique brevemente:", type_question: "abierta", response: [""], user_response: "", category: "USA - E PREGUNTAS DE SEGURIDAD", required: false },

    // SECCIÓN F
    { question: "Indique Plataforma / Red Social, Nombre de usuario / Perfil, y ¿Activo actualmente? para cada perfil de los últimos 5 años:", type_question: "abierta", response: [""], user_response: "", category: "USA - F REDES SOCIALES" },
    { question: "¿Usa otras plataformas o foros en línea?", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "USA - F REDES SOCIALES" },
    { question: "Si es sí, indique cuáles y su nombre de usuario:", type_question: "abierta", response: [""], user_response: "", category: "USA - F REDES SOCIALES", required: false },

    // SECCIÓN G
    { question: "Firma del solicitante (Escriba su nombre completo como firma o ingrese firma digital):", type_question: "abierta", response: [""], user_response: "", category: "USA - G DECLARACIÓN Y FIRMA" },
    { question: "Lugar y fecha (Ciudad, País, DD/MM/AAAA):", type_question: "abierta", response: [""], user_response: "", category: "USA - G DECLARACIÓN Y FIRMA" }
];

// --- ARRAY DE INFORMACIÓN (LECTURA) ---

export const VIPROInfoUSA: VIPROInfoProps[] = [
    // INSTRUCCIONES GENERALES
    { info_text: "INSTRUCCIONES GENERALES", category: "USA - INSTRUCCIONES GENERALES" },
    { info_text: "Por favor complete este formulario con letra de molde clara o en su versión digital. Toda la información debe ser exacta, completa y verídica. Esta información será utilizada para completar el formulario oficial DS-160 (Online Nonimmigrant Visa Application) ante el Departamento de Estado de los EE.UU. y para la preparación de su expediente consular. Los campos marcados con (*) son obligatorios. La visa más común es la B1/B2 (turismo y negocios).", category: "USA - INSTRUCCIONES GENERALES" },
    
    // NOTAS Y ADVERTENCIAS POR SECCIÓN
    { info_text: "ℹ️ Si nunca ha tenido un SSN o U.S. Tax ID, deje esos campos en blanco.", category: "USA - A.1 DATOS DE IDENTIDAD" },
    { info_text: "ℹ️ Su pasaporte debe tener vigencia mínima de 6 meses más allá de la estancia prevista en EE.UU.", category: "USA - A.2 DATOS DEL PASAPORTE" },
    { info_text: "ℹ️ El Departamento de Estado solicita información de redes sociales de los últimos 5 años en el DS-160.", category: "USA - A.3 INFORMACIÓN DE CONTACTO" },
    { info_text: "ℹ️ Cada hijo menor que viaje con usted necesita su propio pasaporte y visa o ESTA. Proporcione sus datos en hoja aparte.", category: "USA - A.4 ESTADO CIVIL Y FAMILIA" },
    { info_text: "ℹ️ Declare todos los familiares en EE.UU. aunque no los visitará. La omisión puede considerarse información incompleta.", category: "USA - A.6 FAMILIARES EN EE.UU." },
    { info_text: "ℹ️ Si es trabajador independiente o empresario, adjunte documentos de actividad económica, registro y estados financieros.", category: "USA - B.1 SITUACIÓN LABORAL" },
    { info_text: "ℹ️ El oficial consular evaluará su capacidad económica para costear el viaje y su retorno. Presente extractos bancarios de los últimos 3 a 6 meses.", category: "USA - B.4 SITUACIÓN FINANCIERA" },
    { info_text: "ℹ️ La visa B1/B2 es válida generalmente por 10 años con entradas múltiples, pero la estadía autorizada por el oficial de CBP suele ser 6 meses por entrada.", category: "USA - C.1 DETALLES VISA" },
    { info_text: "ℹ️ Si alguna vez excedió la estadía autorizada (overstay) en EE.UU., es OBLIGATORIO declararlo. El ocultamiento puede resultar en prohibición permanente.", category: "USA - C.4 HISTORIAL VIAJES EE.UU." },
    { info_text: "ℹ️ Si no tiene contacto personal en EE.UU., indique el nombre del hotel o empresa que visitará.", category: "USA - D CONTACTO EN EE.UU." },
    { info_text: "AVISO CRÍTICO: Estas preguntas son exactamente las que aparecen en el formulario oficial DS-160 del Departamento de Estado de EE.UU. Deben responderse con total honestidad. Proporcionar información falsa puede resultar en negación permanente de visa, deportación o procesamiento legal bajo las leyes de inmigración de EE.UU. (INA).", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { info_text: "ℹ️ En algunos casos se puede solicitar un examen médico con médico autorizado por la Embajada.", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { info_text: "⚠️ Incluya todos los arrestos, incluso si no hubo condena, si el caso fue sobreseído o si cumplió tiempo en prisión.", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { info_text: "⚠️ El overstay (exceso de estadía) es una de las causas más comunes de negación de visa. Declárelo aunque haya sido por pocos días.", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { info_text: "⚠️ Si respondió 'Sí' a cualquier pregunta de seguridad, informe inmediatamente a su asesor de Volamos Viajes ANTES de continuar con el proceso.", category: "USA - E PREGUNTAS DE SEGURIDAD" },
    { info_text: "El Departamento de Estado de EE.UU. solicita los identificadores de redes sociales usados en los últimos 5 años. Proporcionar información en el siguiente campo.", category: "USA - F REDES SOCIALES" },
    { info_text: "ℹ️ Incluya: Facebook, Instagram, Twitter/X, LinkedIn, TikTok, YouTube, Snapchat, Pinterest, WhatsApp (si tiene cuenta pública), Telegram, Reddit, y cualquier otra red social o foro que haya utilizado en los últimos 5 años.", category: "USA - F REDES SOCIALES" },
    { info_text: "Yo, el/la abajo firmante, bajo juramento o declaración solemne, declaro que toda la información proporcionada en este preformulario y en el formulario DS-160 es verdadera, exacta y completa en la medida de mi conocimiento. Entiendo que las leyes de inmigración de los Estados Unidos (INA — Immigration and Nationality Act) sancionan las declaraciones falsas con negación de visa, deportación, y hasta procesamiento penal. Entiendo que la Embajada o Consulado de EE.UU. puede verificar toda la información que proporciono.", category: "USA - G DECLARACIÓN Y FIRMA" },
    { info_text: "Autorizo expresamente a Volamos Viajes a utilizar esta información para gestionar y orientar mi proceso de solicitud de visa ante el Departamento de Estado de los EE.UU., la Embajada o Consulado correspondiente.", category: "USA - G DECLARACIÓN Y FIRMA" },

    // ANEXO A
    { info_text: "ANEXO A — REQUISITOS Y DOCUMENTOS PARA VISA AMERICANA (B1/B2): Los siguientes documentos aplican para la Visa de No Inmigrante B1/B2 (turismo y negocios). Algunos países o perfiles de solicitante pueden requerir documentos adicionales. La visa B1/B2 es procesada directamente por la Embajada o Consulado de EE.UU. — NO a través de VFS Global en todos los países.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "1. DOCUMENTOS DE IDENTIDAD: Pasaporte vigente con mínimo 6 meses de validez más allá de la estancia prevista. Pasaportes anteriores que contengan visas de EE.UU. previas (si aplica). Fotocopia de todas las páginas del pasaporte actual con sellos de entrada/salida. Documento de identidad nacional vigente. 1 fotografía reciente tamaño 5x5 cm (fondo blanco, sin lentes).", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "2. FORMULARIO OFICIAL DS-160: Formulario DS-160 completado en línea en: ceac.state.gov. Página de confirmación impresa. Comprobante de pago de la tarifa MRV (Machine Readable Visa): actualmente USD $185 para B1/B2 (sujeto a cambio). Número de confirmación de pago MRV.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "3. CITA CONSULAR: Comprobante de cita en la Embajada o Consulado de EE.UU. Número de referencia del pago MRV. En algunos países puede requerirse cita previa para biométricos.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "4. DOCUMENTOS FINANCIEROS: Extractos bancarios originales de los últimos 3 a 6 meses. Carta del banco. Declaración de renta, ISR o constancia fiscal. Si recibe patrocinio: carta de patrocinador. Evidencia de activos: escrituras, inversiones, vehículos.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "5. DOCUMENTOS LABORALES Y/O EDUCATIVOS: Carta de empleo en inglés o traducida. Constancia de afiliación a seguridad social. Si es independiente: registro mercantil, declaraciones. Si es estudiante: carta de la institución. Si es jubilado: carta de pensión.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "6. DOCUMENTOS DEL VIAJE: Reserva de vuelo de ida y vuelta (NO compre boletos antes de tener la visa). Reserva o confirmación del hospedaje. Itinerario del viaje. Seguro de viaje recomendado.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "7. DOCUMENTOS DE LAZOS CON EL PAÍS DE ORIGEN: Título de propiedad o contrato de arrendamiento. Contrato laboral vigente. Partida de nacimiento de hijos menores. Carta del cónyuge. Constancia de matrícula escolar de hijos. Documentos de negocios activos.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "8. DOCUMENTOS ADICIONALES SEGÚN PERFIL: Visita familiar (carta de invitación). Viaje de negocios (carta de empresa, agenda). Visita médica (carta del médico, diagnóstico). Estudiante F1 (I-20, carta aceptación). Menores (autorización notariada). Historial de rechazo (carta explicando cambio de circunstancias).", category: "USA - ANEXOS Y REQUISITOS" },

    // ANEXO B
    { info_text: "ANEXO B — GUÍA DEL PROCESO PASO A PASO: Proceso completo para la Visa de No Inmigrante B1/B2 de EE.UU. Generalmente incluye una entrevista personal con el oficial consular.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 1: Complete el Preformulario de Captación y reúna todos los documentos del Anexo A antes de continuar. Entregue el preformulario a Volamos Viajes.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 2: Verificación y Preparación del Expediente. Volamos Viajes revisará el expediente para verificar que esté completo.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 3: Pago de la Tarifa MRV. Pague la tarifa consular de USD $185 en el banco designado o en línea. Guarde el comprobante.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 4: Completar el Formulario DS-160 en Línea en ceac.state.gov. Guarde la página de confirmación. NO modifique el DS-160 después de agendada la cita.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 5: Agendar la Cita Consular en ustraveldocs.com con el número de confirmación del DS-160 y pago MRV.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 6: Preparación para la Entrevista Consular. Revise documentos y prepare respuestas claras.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 7: Asistir a la Entrevista. Lleve pasaporte, página DS-160, pago MRV y documentos de soporte. La entrevista suele durar entre 2 y 5 minutos.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 8: Resultado. Aprobado (pasaporte retenido), Negado (oficial indicará motivo, comúnmente 214(b)) o Administrative Processing.", category: "USA - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 9: Recepción de Visa y Viaje. Revise su visa. NO exceda la estadía autorizada en su I-94.", category: "USA - ANEXOS Y REQUISITOS" },

    // CONTACTO
    { info_text: "DATOS DE CONTACTO Y NOTAS FINALES: VOLAMOS VIAJES (Agencia Corporativa de Viajes). WhatsApp: 7020-0976, Email: reservas1@volamosviajes.com, Web: www.volamosviajes.com. IMPORTANTE: Los tiempos de espera pueden ser meses. La tarifa MRV NO es reembolsable. Volamos Viajes orienta, pero la decisión es exclusiva del oficial consular. NO compre boletos sin visa aprobada.", category: "USA - CONTACTO Y NOTAS" }
];