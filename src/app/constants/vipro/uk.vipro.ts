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

export const VIPROQuestionsUK: VIPROQuestionsProps[] = [
    // SECCIÓN A.1 DATOS DE IDENTIDAD
    { question: "Apellido(s):[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.1 DATOS DE IDENTIDAD" },
    { question: "Nombre(s):[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.1 DATOS DE IDENTIDAD" },
    { question: "Otros nombres / alias:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.1 DATOS DE IDENTIDAD", required: false },
    { question: "Fecha de nacimiento:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.1 DATOS DE IDENTIDAD" },
    { question: "Lugar de nacimiento:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.1 DATOS DE IDENTIDAD" },
    { question: "País de nacimiento:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.1 DATOS DE IDENTIDAD" },
    { question: "Género:[cite: 2]", type_question: "opcion multiple", response: ["Masculino", "Femenino", "No especificado"], user_response: "", category: "UK - A.1 DATOS DE IDENTIDAD" },
    { question: "Nacionalidad actual:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.1 DATOS DE IDENTIDAD" },
    { question: "¿Ha tenido otra nacionalidad?[cite: 2]", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "UK - A.1 DATOS DE IDENTIDAD" },
    { question: "Si es si, indique cuál:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.1 DATOS DE IDENTIDAD", required: false },
    { question: "Número de pasaporte:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.1 DATOS DE IDENTIDAD" },
    { question: "Fecha de expedición:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.1 DATOS DE IDENTIDAD" },
    { question: "Fecha de vencimiento:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.1 DATOS DE IDENTIDAD" },
    { question: "País que emitió el pasaporte:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.1 DATOS DE IDENTIDAD" },

    // SECCIÓN A.2 INFORMACIÓN DE CONTACTO
    { question: "Dirección residencial:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.2 INFORMACIÓN DE CONTACTO" },
    { question: "Ciudad:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.2 INFORMACIÓN DE CONTACTO" },
    { question: "Departamento / Estado / Provincia:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.2 INFORMACIÓN DE CONTACTO" },
    { question: "País de residencia:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.2 INFORMACIÓN DE CONTACTO" },
    { question: "Código Postal:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.2 INFORMACIÓN DE CONTACTO" },
    { question: "Teléfono celular:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.2 INFORMACIÓN DE CONTACTO" },
    { question: "Teléfono de casa:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.2 INFORMACIÓN DE CONTACTO", required: false },
    { question: "Teléfono de trabajo:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.2 INFORMACIÓN DE CONTACTO", required: false },
    { question: "Correo electrónico:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.2 INFORMACIÓN DE CONTACTO" },
    { question: "Correo electrónico alternativo:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.2 INFORMACIÓN DE CONTACTO", required: false },

    // SECCIÓN A.3 ESTADO CIVIL Y FAMILIA
    { question: "Estado civil:[cite: 2]", type_question: "opcion multiple", response: ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Unión libre"], user_response: "", category: "UK - A.3 ESTADO CIVIL Y FAMILIA" },
    { question: "Nombre completo del cónyuge / pareja:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.3 ESTADO CIVIL Y FAMILIA", required: false },
    { question: "Fecha de matrimonio / unión:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.3 ESTADO CIVIL Y FAMILIA", required: false },
    { question: "Nacionalidad del cónyuge:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.3 ESTADO CIVIL Y FAMILIA", required: false },
    { question: "¿Su cónyuge viaja con usted?[cite: 2]", type_question: "opcion multiple", response: ["Si", "No"], user_response: "", category: "UK - A.3 ESTADO CIVIL Y FAMILIA", required: false },
    { question: "Número de hijos:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.3 ESTADO CIVIL Y FAMILIA", required: false },

    // SECCIÓN A.4 DATOS DEL PADRE
    { question: "Apellidos del padre:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.4 DATOS DEL PADRE" },
    { question: "Nombres del padre:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.4 DATOS DEL PADRE" },
    { question: "Fecha de nacimiento del padre:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.4 DATOS DEL PADRE" },
    { question: "Nacionalidad del padre:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.4 DATOS DEL PADRE" },
    { question: "¿Vive?[cite: 2]", type_question: "opcion multiple", response: ["Si", "No"], user_response: "", category: "UK - A.4 DATOS DEL PADRE" },

    // SECCIÓN A.5 DATOS DE LA MADRE
    { question: "Apellidos de la madre:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.5 DATOS DE LA MADRE" },
    { question: "Nombres de la madre:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.5 DATOS DE LA MADRE" },
    { question: "Fecha de nacimiento de la madre:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.5 DATOS DE LA MADRE" },
    { question: "Nacionalidad de la madre:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - A.5 DATOS DE LA MADRE" },
    { question: "¿Vive?[cite: 2]", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "UK - A.5 DATOS DE LA MADRE" },

    // SECCIÓN B.1 SITUACIÓN LABORAL ACTUAL
    { question: "Situación laboral:[cite: 2]", type_question: "opcion multiple", response: ["Empleado", "Independiente", "Empresario", "Estudiante", "Desempleado", "Pensionado/Jubilado"], user_response: "", category: "UK - B.1 SITUACIÓN LABORAL" },
    { question: "Nombre del empleador / empresa:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - B.1 SITUACIÓN LABORAL" },
    { question: "Cargo/puesto actual:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - B.1 SITUACIÓN LABORAL" },
    { question: "Dirección de la empresa:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - B.1 SITUACIÓN LABORAL" },
    { question: "Teléfono de la empresa:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - B.1 SITUACIÓN LABORAL" },
    { question: "Fecha de inicio del empleo:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - B.1 SITUACIÓN LABORAL" },
    { question: "Ingreso mensual neto (en USD u otra moneda):[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - B.1 SITUACIÓN LABORAL" },
    { question: "Nombre y cargo del supervisor/jefe inmediato:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - B.1 SITUACIÓN LABORAL" },

    // SECCIÓN B.2 SITUACIÓN FINANCIERA
    { question: "Saldo promedio en cuenta bancaria:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - B.2 SITUACIÓN FINANCIERA" },
    { question: "Nombre del banco principal:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - B.2 SITUACIÓN FINANCIERA" },
    { question: "Otros activos o propiedades que posee:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - B.2 SITUACIÓN FINANCIERA" },
    { question: "¿Recibe patrocinio para el viaje?[cite: 2]", type_question: "opcion multiple", response: ["Si", "No"], user_response: "", category: "UK - B.2 SITUACIÓN FINANCIERA" },
    { question: "Nombre del patrocinador:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - B.2 SITUACIÓN FINANCIERA" },
    { question: "Relación con el patrocinador:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - B.2 SITUACIÓN FINANCIERA" },
    { question: "Ingresos anuales declarados (aprox.):[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - B.2 SITUACIÓN FINANCIERA" },

    // SECCIÓN C.1 DETALLES DEL VIAJE AL REINO UNIDO
    { question: "Tipo de visa solicitada:[cite: 2]", type_question: "opcion multiple", response: ["Turista (Standard Visitor)", "Negocios", "Estudio (corto)", "Tránsito", "Familiar", "Médica"], user_response: "", category: "UK - C.1 DETALLES DEL VIAJE" },
    { question: "Propósito principal del viaje:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.1 DETALLES DEL VIAJE" },
    { question: "Fecha de llegada prevista al RU:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.1 DETALLES DEL VIAJE" },
    { question: "Fecha de salida prevista del RU:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.1 DETALLES DEL VIAJE" },
    { question: "Duración total de la estadía (días):[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.1 DETALLES DEL VIAJE" },
    { question: "Puerto de entrada al RU (aeropuerto):[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.1 DETALLES DEL VIAJE" },
    { question: "¿Tiene boleto aéreo confirmado?[cite: 2]", type_question: "opcion multiple", response: ["Si", "No - en proceso"], user_response: "", category: "UK - C.1 DETALLES DEL VIAJE" },
    { question: "Aerolínea y número de vuelo (si aplica):[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.1 DETALLES DEL VIAJE" },
    { question: "Dirección donde se hospedará en el RU:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.1 DETALLES DEL VIAJE" },
    { question: "Nombre del hotel / contacto en el RU:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.1 DETALLES DEL VIAJE" },
    { question: "Número de teléfono del hospedaje:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.1 DETALLES DEL VIAJE" },

    // SECCIÓN C.2 CONTACTO EN EL REINO UNIDO (SI APLICA)
    { question: "Nombre completo del contacto:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.2 CONTACTO EN EL RU" },
    { question: "Dirección en el RU:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.2 CONTACTO EN EL RU" },
    { question: "Teléfono del contacto:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.2 CONTACTO EN EL RU" },
    { question: "Relación con usted:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.2 CONTACTO EN EL RU" },

    // SECCIÓN C.3 HISTORIAL DE VIAJES INTERNACIONALES
    { question: "Historial de Viajes Internacionales (últimos 10 años). Indique País visitado, Fecha entrada, Fecha salida, Propósito:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.3 HISTORIAL VIAJES" },

    // SECCIÓN C.4 VISAS ANTERIORES AL REINO UNIDO
    { question: "¿Ha tenido visa UK anteriormente?[cite: 2]", type_question: "opcion multiple", response: ["Si", "No"], user_response: "", category: "UK - C.4 VISAS ANTERIORES" },
    { question: "Si es si, número de visa anterior:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.4 VISAS ANTERIORES", required: false },
    { question: "¿Le fue negada alguna visa UK?[cite: 2]", type_question: "opcion multiple", response: ["Sí", "No"], user_response: "", category: "UK - C.4 VISAS ANTERIORES" },
    { question: "Si es si, indique la fecha y el motivo:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - C.4 VISAS ANTERIORES", required: false },

    // SECCIÓN D: PREGUNTAS DE SEGURIDAD E HISTORIAL
    { question: "D.1 ¿Ha sido condenado/a por algún delito en cualquier país?[cite: 2]", type_question: "opcion multiple", response: ["Si", "No"], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD" },
    { question: "Si es si, describa el delito, país y fecha:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD", required: false },
    { question: "D.2 ¿Tiene algún proceso penal pendiente?[cite: 2]", type_question: "opcion multiple", response: ["Si", "No"], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD" },
    { question: "Si es si, describa:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD", required: false },
    { question: "D.3 ¿Ha sido deportado o expulsado de algún país?[cite: 2]", type_question: "opcion multiple", response: ["Si", "No"], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD" },
    { question: "Si es si, indique país, fecha y motivo:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD", required: false },
    { question: "D.4 ¿Ha violado alguna condición de visa en el pasado?[cite: 2]", type_question: "opcion multiple", response: ["Si", "No"], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD" },
    { question: "Si es si, explique:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD", required: false },
    { question: "D.5 ¿Ha participado en actividades terroristas, extremismo o grupos ilegales?[cite: 2]", type_question: "opcion multiple", response: ["SI", "No"], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD" },
    { question: "D.6 ¿Ha participado en conflictos armados?[cite: 2]", type_question: "opcion multiple", response: ["Si", "No"], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD" },
    { question: "D.7 ¿Ha trabajado o prestado servicios para algún gobierno o fuerza militar?[cite: 2]", type_question: "opcion multiple", response: ["Si", "No"], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD" },
    { question: "Si es si, indique cuál y en qué cargo:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD", required: false },
    { question: "D.8 ¿Tiene alguna condición médica que requiera tratamiento durante su estadía?[cite: 2]", type_question: "opcion multiple", response: ["Si", "No"], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD" },
    { question: "Si es si, describa brevemente:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD", required: false },
    { question: "D.9 ¿Ha solicitado o recibido asilo en algún país?[cite: 2]", type_question: "opcion multiple", response: ["Si", "No"], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD" },
    { question: "D.10 ¿Algún familiar ha sido negado ingreso al Reino Unido?[cite: 2]", type_question: "opcion multiple", response: ["Si", "No"], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD" },
    { question: "Si es si, relación y circunstancias:[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - D PREGUNTAS DE SEGURIDAD", required: false },

    // DECLARACIÓN Y FIRMA
    { question: "Firma del solicitante (Firma o huella digital):[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - DECLARACIÓN Y FIRMA" },
    { question: "Lugar y fecha (Ciudad, País, Fecha DD/MM/AAAA):[cite: 2]", type_question: "abierta", response: [""], user_response: "", category: "UK - DECLARACIÓN Y FIRMA" }
];


// --- ARRAY DE INFORMACIÓN (LECTURA) ---

export const VIPROInfoUK: VIPROInfoProps[] = [
    // INSTRUCCIONES GENERALES
    { info_text: "INSTRUCCIONES GENERALES[cite: 2]", category: "UK - INSTRUCCIONES GENERALES" },
    { info_text: "Por favor complete este formulario con letra de molde clara y legible, o en su versión digital. Toda la información proporcionada debe ser exacta y verídica. Esta información será utilizada para completar su solicitud oficial de visa UK ante UKVI (UK Visas and Immigration) a través de los centros VFS Global. Los campos marcados con (*) son de carácter obligatorio.[cite: 2]", category: "UK - INSTRUCCIONES GENERALES" },
    
    // NOTAS Y ADVERTENCIAS POR SECCIÓN
    { info_text: "ℹ️ Su pasaporte debe tener una vigencia mínima de 6 meses al momento del viaje.[cite: 2]", category: "UK - A.1 DATOS DE IDENTIDAD" },
    { info_text: "ℹ️ Si tiene hijos que lo acompañan, proporcione sus datos completos en hoja adjunta.[cite: 2]", category: "UK - A.3 ESTADO CIVIL Y FAMILIA" },
    { info_text: "ℹ️ Si es trabajador independiente, indique su actividad económica y adjunte documentación de respaldo.[cite: 2]", category: "UK - B.1 SITUACIÓN LABORAL" },
    { info_text: "ℹ️ Deberá presentar extractos bancarios de los últimos 3 a 6 meses con saldo suficiente para cubrir su estadía.[cite: 2]", category: "UK - B.2 SITUACIÓN FINANCIERA" },
    { info_text: "IMPORTANTE: Responda con total honestidad. Las declaraciones falsas pueden resultar en la cancelación de la visa, prohibición de entrada al Reino Unido y consecuencias legales.[cite: 2]", category: "UK - D PREGUNTAS DE SEGURIDAD" },
    { info_text: "ℹ️ Incluya condenas previas aunque hayan sido cumplidas o saldadas.[cite: 2]", category: "UK - D PREGUNTAS DE SEGURIDAD" },
    
    // DECLARACIÓN Y AUTORIZACIÓN
    { info_text: "Yo, el/la abajo firmante, declaro que toda la información proporcionada en este formulario es verdadera, completa y exacta hasta donde tengo conocimiento. Entiendo que proporcionar información falsa o engañosa puede resultar en el rechazo de mi solicitud de visa, cancelación de cualquier visa otorgada o prohibición de entrada al Reino Unido.[cite: 2]", category: "UK - DECLARACIÓN Y FIRMA" },
    { info_text: "También autorizo a Volamos Viajes a gestionar y presentar mi documentación ante las autoridades competentes de UKVI y VFS Global en mi nombre.[cite: 2]", category: "UK - DECLARACIÓN Y FIRMA" },

    // ANEXO A - REQUISITOS
    { info_text: "ANEXO A — REQUISITOS Y DOCUMENTOS PARA VISA UK[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "Los siguientes documentos deben presentarse en original y copia. Todos los documentos en idioma distinto al inglés deben incluir traducción oficial certificada. La lista aplica a la mayoría de países que requieren visa UK, aunque pueden existir requisitos adicionales según la nacionalidad del solicitante.[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "1. DOCUMENTOS DE IDENTIDAD Y VIAJE: Pasaporte vigente con mínimo 6 meses de validez al momento del viaje. Pasaportes anteriores que contengan visas previas (si aplica). Fotocopia de todas las páginas del pasaporte con sellos. 2 fotografías recientes tamaño pasaporte (fondo blanco, sin lentes, tomadas en los últimos 6 meses). Documento nacional de identidad (DUI, cédula, documento de identidad local).[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "2. FORMULARIO DE SOLICITUD: Formulario VAF1A completado en línea vía www.gov.uk/apply-uk-visa (Standard Visitor Visa). Comprobante de pago de la tasa consular correspondiente. Comprobante de cita en VFS Global (centro autorizado más cercano).[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "3. DOCUMENTOS FINANCIEROS: Extractos bancarios originales de los últimos 3 a 6 meses (sellados por el banco). Carta original del banco que certifique la titularidad de la cuenta. Declaración de renta o ISR del último año fiscal. Si recibe patrocinio: carta de patrocinio firmada con documentos financieros del patrocinador. Constancia de ingresos o carta salarial del empleador (con membrete oficial).[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "4. DOCUMENTOS LABORALES Y/O EDUCATIVOS: Carta de empleo original en inglés o con traducción certificada (incluir cargo, salario, duración del contrato, permiso de ausencia autorizado). Si es independiente: registro mercantil, RUC, patente comercial o documentos que acrediten su actividad. Si es estudiante: carta de la institución educativa con beca si aplica, matrícula vigente. Si es jubilado: constancia de pensión mensual o carta de la institución que la administra.[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "5. DOCUMENTOS DE VIAJE: Reserva de vuelo de ida y vuelta (no requiere boleto comprado, pero sí reserva con datos completos). Reserva o confirmación del hospedaje en el Reino Unido. Itinerario detallado del viaje (actividades, ciudades a visitar, fechas). Seguro de viaje con cobertura mínima de £100,000 GBP o equivalente en USD.[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "6. DOCUMENTOS DE VÍNCULOS CON EL PAÍS DE ORIGEN: Título de propiedad de inmueble o contrato de arrendamiento vigente. Contrato laboral vigente con fecha de regreso aprobada. Partida de nacimiento de hijos menores que permanezcan en el país. Constancia de bienes o activos en el país de origen (vehículos, propiedades, etc.).[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "7. DOCUMENTOS ADICIONALES SEGÚN PERFIL: Si viaja con menores: acta de nacimiento + autorización notariada de ambos padres (si solo viaja uno). Si visita familia: carta de invitación firmada + copia de residencia/ciudadanía del familiar. Si el viaje es por razones médicas: carta del médico tratante en el RU + historial médico. Si el viaje es de negocios: carta de la empresa en el RU, contrato o agenda de reuniones. Si es solicitante de asistencia adicional (biometría fuera del centro): solicitar apoyo especial en VFS.[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },

    // ANEXO B - PROCESO
    { info_text: "ANEXO B — GUÍA DEL PROCESO PASO A PASO[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "Esta guía describe el proceso estándar para solicitar una visa UK a través de los canales oficiales UKVI y VFS Global, el centro de visas más grande del mundo, presente en más de 140 países.[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 1: Complete el Preformulario de Captación (este documento). Llene este preformulario con toda la información requerida. Reúna todos los documentos señalados en el Anexo A. Entregue el preformulario y documentos a su agente de Volamos Viajes.[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 2: Revisión y Preparación del Expediente. Nuestro equipo revisará su expediente para verificar que esté completo. Se le notificará si falta algún documento o se requiere información adicional. Se prepara el expediente en el orden que exige UKVI.[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 3: Solicitud en Línea (www.gov.uk). Se llena el formulario oficial VAF1A en el portal de UKVI. Se selecciona el tipo de visa: Standard Visitor (turismo/negocios/médica/familiar). Se realiza el pago de la tarifa consular: actualmente £115 GBP para visita estándar (sujeto a cambios). Se obtiene el número de referencia GWF (Global Web Form).[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 4: Agendar Cita en VFS Global. Con el número GWF, se agenda cita en el centro VFS Global más cercano a su ciudad. VFS Global tiene presencia en más de 140 países - verifique el centro disponible para su país. Los centros VFS ofrecen: presentación de documentos, toma de biometría (huellas + foto) y servicios adicionales premium.[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 5: Asistir a la Cita en VFS Global. Presentarse puntualmente con todos los documentos originales y copias. Se realizará el proceso biométrico (huellas dactilares y fotografía digital). Se hace entrega oficial del expediente al personal de VFS. No se realizan entrevistas en la mayoría de los casos de visa estándar.[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 6: Evaluación por parte de UKVI. UKVI analiza su solicitud. El tiempo promedio de resolución es de 3 semanas hábiles. En algunos casos se puede solicitar el servicio de procesamiento prioritario (5 días hábiles) con costo adicional. UKVI puede solicitar documentos adicionales o entrevista (poco frecuente). NO viaje al RU hasta recibir la visa aprobada en su pasaporte.[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 7: Devolución del Pasaporte. Una vez procesada la solicitud, el pasaporte le será devuelto con la visa estampada (si fue aprobada). La devolución puede ser en el centro VFS o por servicio de mensajería (con costo adicional). Si fue rechazada, recibirá una carta con el motivo. En ciertos casos se puede apelar.[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },
    { info_text: "PASO 8: Recepción de la Visa y Preparación del Viaje. Revise cuidadosamente su visa: nombre, fechas, número de entradas permitidas. Guarde el pasaporte en lugar seguro. Coordine con Volamos Viajes sus boletos aéreos, hospedaje y seguro de viaje. Lleve siempre copias de su visa y documentos de respaldo al momento de viajar.[cite: 2]", category: "UK - ANEXOS Y REQUISITOS" },

    // CONTACTO
    { info_text: "DATOS DE CONTACTO Y NOTAS FINALES: VOLAMOS VIAJES (Agencia Corporativa de Viajes). WhatsApp: 7020-0976, Email: reservas1@volamosviajes.com, Web: www.volamosviajes.com.[cite: 2]", category: "UK - CONTACTO Y NOTAS" },
    { info_text: "IMPORTANTE: Los tiempos de procesamiento pueden variar. Las tasas consulares están sujetas a cambios sin previo aviso. Volamos Viajes no garantiza la aprobación de visa, ya que es decisión exclusiva de UKVI. Inicie su proceso con al menos 6 semanas de anticipación.[cite: 2]", category: "UK - CONTACTO Y NOTAS" }
];