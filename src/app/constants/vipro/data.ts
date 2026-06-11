export type VIPROQuestionsProps = {
    question: string;
    type_question: string;
    response: string[];
    user_response: string;
    category: string;
} 

export const VIPROQuestions: VIPROQuestionsProps[] = [
    // --- DATOS PERSONALES ---
    { 
        "question": "¿Cuál es su nombre completo?", 
        "type_question": "abierta", 
        "response": [""], 
        "user_response": "", 
        "category": "DATOS PERSONALES" 
    },
    { 
        "question": "Fecha de vencimiento de su pasaporte (debe tener una vigencia mínima de 180 días)", 
        "type_question": "abierta", 
        "response": [""], 
        "user_response": "", 
        "category": "DATOS PERSONALES" 
    },
    { 
        "question": "Fecha de nacimiento", 
        "type_question": "abierta", 
        "response": [""], 
        "user_response": "", 
        "category": "DATOS PERSONALES" 
    },
    { 
        "question": "Estado civil actual", 
        "type_question": "cerrada", 
        "response": ["Soltero(a)", "Casado(a)", "Divorciado(a)", "Viudo(a)", "Unión Libre"], 
        "user_response": "", 
        "category": "DATOS PERSONALES" 
    },
    { 
        "question": "¿Ha solicitado una visa estadounidense anteriormente?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "DATOS PERSONALES" 
    },
    { 
        "question": "¿Le han negado una visa estadounidense anteriormente?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "DATOS PERSONALES" 
    },
    { 
        "question": "¿Alguna vez ha ingresado de manera no autorizada (irregular) a Estados Unidos?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "DATOS PERSONALES" 
    },
    { 
        "question": "¿Alguna vez ha sido deportado de Estados Unidos?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "DATOS PERSONALES" 
    },
    { 
        "question": "¿Alguna vez ha estado detenido por las autoridades en Estados Unidos?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "DATOS PERSONALES" 
    },
    { 
        "question": "¿Alguna vez le han cancelado una visa estadounidense?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "DATOS PERSONALES" 
    },

    // --- ARRAIGOS FAMILIARES Y FINANCIEROS ---
    { 
        "question": "¿Tienen sus padres una visa estadounidense vigente?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿El motivo principal de su viaje a Estados Unidos es una visita familiar?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Desea viajar a Estados Unidos con fines turísticos?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Desea viajar a Estados Unidos por motivos de negocios?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Desea viajar a Estados Unidos con el fin de trabajar?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Posee una oferta de trabajo formal o carta de contrato de una empresa en Estados Unidos?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Tiene algún familiar directo en estado grave de salud en Estados Unidos?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Cuál es el estatus migratorio de su familiar en Estados Unidos?", 
        "type_question": "cerrada", 
        "response": ["Residente", "Ciudadano", "No tengo familiares en ese país"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Su estadía planeada en Estados Unidos será menor a 30 días?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Sus gastos de viaje serán financiados por otra persona?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Será usted el responsable de financiar la totalidad de su viaje?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Su viaje se realiza en representación de un grupo, empresa u organización?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Posee una carta de invitación de una institución pública o privada para viajar a EE. UU.?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Ha solicitado una visa americana en los últimos 6 meses?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Tiene familiares directos en Estados Unidos (padres, hermanos o hijos)?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Qué estatus migratorio poseen sus familiares directos en EE. UU.?", 
        "type_question": "cerrada", 
        "response": ["Ciudadanos", "Residentes", "Otros", "No aplica"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Cuenta con la invitación formal de alguna persona en Estados Unidos?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Qué relación tiene con la persona que le realiza la invitación?", 
        "type_question": "cerrada", 
        "response": ["Familiar", "Amistad / Negocios / Otro", "No aplica"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿La persona que le invita es ciudadana o residente estadounidense?", 
        "type_question": "cerrada", 
        "response": ["Ciudadano", "Residente", "No aplica"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Cuál es la situación de su vivienda actual?", 
        "type_question": "cerrada", 
        "response": ["Propia", "Alquilada", "Hipotecada", "Familiar / Otra"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Dispone de una constancia de estudios vigente?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Es propietario de una empresa legalmente constituida que declare impuestos en su país?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },

    // --- SITUACIÓN LABORAL Y ACADÉMICA (Movidos desde Historial Delictivo) ---
    { 
        "question": "¿Se encuentra empleado o trabajando actualmente?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Cuenta con solvencia tributaria (impuestos al día) en su país?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Sus ingresos mensuales son similares o mayores a $1,200.00 USD?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Posee una constancia laboral con al menos un año de antigüedad?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Declara impuestos formalmente en su país?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Cuál es su nivel máximo de educación alcanzado?", 
        "type_question": "cerrada", 
        "response": ["Básico / Primaria", "Bachillerato / Secundaria", "Graduado Universitario", "Maestría / Posgrado", "Doctorado", "Especialización Técnica"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },
    { 
        "question": "¿Se encuentra cursando estudios académicos actualmente?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "ARRAIGOS FAMILIARES Y FINANCIEROS" 
    },

    // --- HISTORIAL DE VIAJES ---
    { 
        "question": "¿Ha realizado viajes fuera de su país de manera legal anteriormente?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "HISTORIAL DE VIAJES" 
    },
    { 
        "question": "¿Ha realizado viajes internacionales en los últimos 12 meses?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "HISTORIAL DE VIAJES" 
    },
    { 
        "question": "¿Ha viajado legalmente a más de 4 países en los últimos 5 años?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "HISTORIAL DE VIAJES" 
    },

    // --- HISTORIAL DELICTIVO Y SEGURIDAD ---
    { 
        "question": "¿Alguna vez ha sido arrestado o detenido en su país de origen?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "HISTORIAL DELICTIVO" 
    },
    { 
        "question": "¿Ha estado involucrado en alguna actividad delictiva o proceso legal relacionado con drogas o sustancias ilícitas?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "HISTORIAL DELICTIVO" 
    },
    { 
        "question": "¿Ha pertenecido formalmente al servicio militar en su país?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "HISTORIAL DELICTIVO" 
    },
    { 
        "question": "¿Ha pertenecido a alguna tribu, secta o grupo no reconocido legalmente por el Estado?", 
        "type_question": "cerrada", 
        "response": ["Sí", "No"], 
        "user_response": "", 
        "category": "HISTORIAL DELICTIVO" 
    },
    {
        "question": "¿Ha estado involucrado en la comisión de algún delito formal en su país?",
        "type_question": "cerrada",
        "response": ["Sí", "No"],
        "user_response": "",
        "category": "HISTORIAL DELICTIVO"
    },
    {
        "question": "¿Alguna vez ha servido, sido miembro o estado involucrado en una unidad paramilitar, unidad de autodefensa, grupo guerrillero u organización insurgente?",
        "type_question": "cerrada",
        "response": ["Sí", "No"],
        "user_response": "",
        "category": "HISTORIAL DELICTIVO"
    }
];
