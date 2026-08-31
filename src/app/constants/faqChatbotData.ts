export interface FAQOption {
  id: string;
  question: string;
  answer: string;
  actionText?: string;
  actionUrl?: string;
}

export interface FAQCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  questions: FAQOption[];
}

export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: "vipro",
    title: "Diagnóstico VIPRO",
    icon: "🎯",
    description: "Evaluación inteligente de perfil consular",
    questions: [
      {
        id: "vipro-que-es",
        question: "¿Qué es el Diagnóstico VIPRO y cómo evalúa mi perfil?",
        answer: "VIPRO es nuestro algoritmo de inteligencia consular que analiza 53 factores clave (lazos económicos, laborales, migratorios y familiares) para calcular tu probabilidad real de aprobación de visa por solo $19.99 USD.",
        actionText: "Iniciar Test VIPRO ($19.99)",
        actionUrl: "/vipro-form"
      },
      {
        id: "vipro-resultado",
        question: "¿Cómo recibo mi resultado VIPRO?",
        answer: "Al completar el formulario VIPRO, obtendrás un reporte inmediato con tu puntaje de viabilidad consular, nivel de riesgo y recomendaciones específicas de nuestros agentes para fortalecer tu perfil.",
        actionText: "Iniciar Evaluación",
        actionUrl: "/vipro-form"
      },
      {
        id: "vipro-costo",
        question: "¿Cuál es el costo del Diagnóstico VIPRO?",
        answer: "El reporte oficial del Diagnóstico VIPRO tiene un costo accesible de $19.99 USD. Incluye dictamen detallado, nivel de riesgo y recomendaciones clave para tu trámite consular.",
        actionText: "Ver Planes y Tarifas",
        actionUrl: "/#precios"
      }
    ]
  },
  {
    id: "ds160",
    title: "Preformulario DS-160",
    icon: "📝",
    description: "Llenado asistido de solicitudes oficiales",
    questions: [
      {
        id: "ds160-requisito-agente",
        question: "¿Necesito contratar un agente para completar mi Preformulario DS-160?",
        answer: "Sí, para acceder al preformulario DS-160 debes contratar primero a un Asesor Consular Certificado. De esta manera, tu agente asignado te acompañará paso a paso y auditará personalmente tus respuestas antes de enviarlas a la Embajada.",
        actionText: "Ver Agentes Disponibles",
        actionUrl: "/agents"
      },
      {
        id: "ds160-como-llenar",
        question: "¿Cómo inicio el proceso del preformulario DS-160?",
        answer: "Una vez que selecciones y contrates a tu asesor de preferencia en nuestro directorio de agentes, se habilitará tu Preformulario DS-160 en tu panel. Podrás completarlo en español con asistencia continua.",
        actionText: "Elegir mi Agente",
        actionUrl: "/agents"
      },
      {
        id: "ds160-revision",
        question: "¿Qué beneficios me da contar con un agente certificado?",
        answer: "Tu agente asignado revisa minuciosamente tu información, detecta y corrige incongruencias, redacta tus explicaciones de viaje en el formato que los cónsules esperan y garantiza cero errores en tu solicitud oficial.",
        actionText: "Conocer Agentes Certificados",
        actionUrl: "/agents"
      },
      {
        id: "ds160-guardado",
        question: "¿Puedo pausar y continuar mi preformulario con mi agente?",
        answer: "¡Sí! El preformulario cuenta con autoguardado inteligente. Tú y tu agente pueden revisar los avances por partes y realizar ajustes en cualquier momento.",
        actionText: "Ir a Mi Perfil",
        actionUrl: "/profile"
      }
    ]
  },
  {
    id: "visas",
    title: "Tipos de Visa y Destinos",
    icon: "🌎",
    description: "Requisitos de EE.UU., Canadá, México y más",
    questions: [
      {
        id: "visa-b1b2",
        question: "¿Qué requisitos necesito para la Visa de Turismo B1/B2 de EE.UU.?",
        answer: "Necesitas pasaporte vigente (mínimo 6 meses de validez), contratar a un agente certificado para llenar tu formulario DS-160, pago del arancel MRV ($185 USD) y agendar la cita consular. Nos encargamos de todo el proceso técnico.",
        actionText: "Contratar Agente B1/B2",
        actionUrl: "/agents"
      },
      {
        id: "visa-renovacion",
        question: "¿Puedo renovar mi visa americana sin ir a entrevista?",
        answer: "Sí, si tu visa venció hace menos de 48 meses y aplicas a la misma categoría sin antecedentes negativos, tu agente tramitará la exención de entrevista consular mediante buzón oficial.",
        actionText: "Consultar Exención",
        actionUrl: "/visas"
      },
      {
        id: "visa-otros-paises",
        question: "¿Qué otros países gestionan además de Estados Unidos?",
        answer: "Ofrecemos consultoría especializada mediante agentes expertos para visas de Canadá (ETA y Visitante), México (Visado de Residencia/Turismo), Reino Unido y Australia.",
        actionText: "Ver Destinos Disponibles",
        actionUrl: "/services"
      }
    ]
  },
  {
    id: "citas",
    title: "Citas y Monitoreo",
    icon: "📅",
    description: "Adelanto de fechas y simulacros consulares",
    questions: [
      {
        id: "citas-tiempo",
        question: "¿Cómo funciona el servicio de adelantamiento de cita consular?",
        answer: "Monitoreamos activamente la plataforma del consulado 24/7. En cuanto se liberan cupos por cancelación o reapertura de fechas, tu agente reubica tu cita en el menor tiempo posible.",
        actionText: "Ver Asesores Certificados",
        actionUrl: "/agents"
      },
      {
        id: "citas-simulacro",
        question: "¿En qué consiste el simulacro de entrevista con mi agente?",
        answer: "Es una sesión virtual 1 a 1 con tu asesor consular experto quien realiza una simulación real de la entrevista de la Embajada, evaluando tu gesticulación, respuestas y documentación.",
        actionText: "Agendar Simulacro con Agente",
        actionUrl: "/agents"
      },
      {
        id: "citas-emergencia",
        question: "¿Puedo tramitar una cita de emergencia prioritaria?",
        answer: "Sí, ante urgencias médicas, viajes de trabajo inaplazables o emergencias familiares. Tu agente redactará y justificará la solicitud formal ante la embajada.",
        actionText: "Solicitar Asistencia Urgente",
        actionUrl: "https://wa.me/50370000000?text=Hola,%20necesito%20asistencia%20urgente%20con%20una%20cita%20de%20emergencia"
      }
    ]
  },
  {
    id: "pagos",
    title: "Planes y Formas de Pago",
    icon: "💳",
    description: "Tarifas, comprobantes y pagos con PayPal / Tarjeta",
    questions: [
      {
        id: "pagos-costo",
        question: "¿Cuáles son los precios de los servicios de TodoVisa?",
        answer: "Ofrecemos el Diagnóstico VIPRO por $19.99 USD y la contratación de un Asesor Consular Certificado por $100.00 USD para la gestión integral de tu expediente y preformulario.",
        actionText: "Ver Tabla de Precios",
        actionUrl: "/#precios"
      },
      {
        id: "pagos-metodos",
        question: "¿Qué métodos de pago puedo utilizar?",
        answer: "Aceptamos tarjetas de crédito y débito de cualquier banco (Visa, Mastercard), PayPal con protección al comprador, y transferencias bancarias locales.",
        actionText: "Ir a Mi Perfil / Pagos",
        actionUrl: "/profile"
      },
      {
        id: "pagos-garantia",
        question: "¿Mis pagos están protegidos y respaldados?",
        answer: "Absolutamente. Todos los procesamientos de pago cuentan con encriptación SSL de nivel bancario y garantía de cumplimiento de servicio.",
        actionText: "Ver Términos y Condiciones",
        actionUrl: "/sobre-todovisa"
      }
    ]
  },
  {
    id: "referidos",
    title: "Agencias y Referidos",
    icon: "🤝",
    description: "Programa de socios, agencias aliadas y comisiones",
    questions: [
      {
        id: "referidos-beneficios-agencias",
        question: "¿Qué beneficios tienen las agencias y socios de TodoVisa?",
        answer: "Las agencias asociadas obtienen comisiones por cada trámite referido, panel exclusivo para seguimiento en tiempo real de sus clientes, soporte dedicado 24/7 y acceso a nuestros algoritmos y red de agentes certificados.",
        actionText: "Registrar mi Agencia",
        actionUrl: "/referido"
      },
      {
        id: "referidos-como-funciona",
        question: "¿Cómo funciona el programa de alianzas para agentes y agencias?",
        answer: "Si eres agencia de viajes, profesional o recomendador, puedes registrarte como socio. Recibirás un enlace y código único para ganar comisiones automáticas por cada cliente que contrate a un agente o servicio VIPRO.",
        actionText: "Unirme como Agencia / Referido",
        actionUrl: "/referido"
      },
      {
        id: "referidos-comision",
        question: "¿Cómo retiro mis comisiones como agencia aliada?",
        answer: "Obtienes un porcentaje directo sobre los paquetes contratados. Puedes consultar tus ganancias y solicitar retiros de tus comisiones directamente desde tu panel de usuario o agencia.",
        actionText: "Ver Panel de Agencia",
        actionUrl: "/referral"
      }
    ]
  }
];

export const INITIAL_BOT_MESSAGE = "¡Hola! 👋 Bienvenido al Centro de Ayuda TodoVisa. ¿Qué duda tienes sobre tu trámite o visa? Elige una categoría o busca tu pregunta:";
