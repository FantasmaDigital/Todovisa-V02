"use client";

import { Header } from "@/app/components/shared/Header";
import { Footer } from "@/app/components/shared/Footer";
import Link from "next/link";
import { useRef } from "react";

export default function ViproTerminosPage() {
  const headerRef = useRef(null);

  return (
    <div className="min-h-screen w-full flex flex-col bg-background-main">
      <Header headerRef={headerRef} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-text-primary">
        {/* Breadcrumb & Navigation */}
        <div className="mb-8 flex items-center gap-2 text-xs text-text-secondary font-medium">
          <Link href="/" className="hover:text-brand-primary transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/vipro-form" className="hover:text-brand-primary transition-colors">
            Evaluación VIPRO
          </Link>
          <span>/</span>
          <span className="text-text-primary font-semibold">Términos y Condiciones</span>
        </div>

        {/* Title Header */}
        <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-10 shadow-xs mb-10 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light text-brand-primary font-bold text-xs mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Documento Legal Oficial</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-text-primary tracking-tight leading-tight">
            Términos y Condiciones de Uso VIPRO
          </h1>
          <p className="text-sm font-semibold text-brand-primary mt-2">
            Herramienta de Autoevaluación de Elegibilidad para Visa de No Inmigrante de los Estados Unidos
          </p>
          <div className="mt-4 pt-4 border-t border-border-light flex flex-wrap items-center justify-between gap-4 text-xs text-text-muted">
            <span>Última actualización: 28 de agosto de 2026</span>
            <span>Operado por TODOVISA El Salvador & Latinoamérica</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-10 shadow-xs space-y-8 text-left leading-relaxed text-sm text-text-secondary font-sans">
          
          <p className="text-base text-text-primary leading-relaxed border-l-4 border-brand-primary pl-4 py-1 bg-brand-light/30 rounded-r-lg font-medium">
            Los presentes Términos y Condiciones (en adelante, los &ldquo;Términos&rdquo;) regulan el acceso y uso de la herramienta VIPRO (en adelante, &ldquo;VIPRO&rdquo;, la &ldquo;Herramienta&rdquo; o el &ldquo;Servicio&rdquo;), operada por TODOVISA, S.A. DE C.V., con domicilio en San Salvador, El Salvador, constituida y operando conforme a las leyes de la República de El Salvador (en adelante, &ldquo;la Empresa&rdquo;, &ldquo;nosotros&rdquo; o &ldquo;VIPRO&rdquo;). El Servicio está dirigido a personas ubicadas en El Salvador y demás países de Latinoamérica que deseen realizar una autoevaluación informativa relacionada con una eventual solicitud de visa de no inmigrante ante el Gobierno de los Estados Unidos de América.
          </p>

          <p className="font-semibold text-text-primary">
            Al acceder, registrarse o utilizar VIPRO, el Usuario declara haber leído, entendido y aceptado en su totalidad estos Términos, así como la Política de Privacidad aplicable. Si el Usuario no está de acuerdo con alguna disposición aquí contenida, deberá abstenerse de utilizar el Servicio.
          </p>

          <hr className="border-border-light my-6" />

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-mono">1</span>
              <span>Objeto y Naturaleza del Servicio</span>
            </h2>
            <p>
              VIPRO es una herramienta digital de autoevaluación que, a través de un cuestionario compuesto por aproximadamente cien (100) preguntas, recopila información proporcionada voluntariamente por el Usuario con el fin de generar un resultado orientativo, expresado en forma de porcentaje o nota, sobre sus posibilidades estimadas de elegibilidad respecto a una visa de no inmigrante de los Estados Unidos.
            </p>
            <p className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-amber-900 text-xs font-medium">
              <strong>Importante:</strong> El Servicio constituye exclusivamente una herramienta informativa y de autodiagnóstico basada en los datos suministrados por el propio Usuario. VIPRO no constituye asesoría legal, migratoria ni consular, y no sustituye la opinión de un abogado de inmigración, consultor migratorio autorizado u otro profesional calificado.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-mono">2</span>
              <span>Ausencia de Afiliación con el Gobierno de los Estados Unidos</span>
            </h2>
            <p>La Empresa declara expresamente, y el Usuario reconoce y acepta, que:</p>
            <ul className="list-disc pl-6 space-y-2 marker:text-brand-primary">
              <li>
                VIPRO no es un producto, servicio o plataforma oficial, autorizada, patrocinada, avalada ni afiliada de ninguna forma al Departamento de Estado de los Estados Unidos, al Servicio de Ciudadanía e Inmigración de los Estados Unidos (USCIS), a la Embajada o a cualquier Consulado de los Estados Unidos, ni a ninguna otra entidad, agencia o dependencia gubernamental estadounidense.
              </li>
              <li>
                VIPRO no tiene acceso a, ni utiliza, bases de datos, sistemas o criterios internos, oficiales o confidenciales de dichas entidades gubernamentales para generar sus resultados.
              </li>
              <li>
                El uso del término &ldquo;visa&rdquo;, referencias a procesos consulares o cualquier terminología migratoria dentro de la Herramienta tiene fines exclusivamente descriptivos e informativos, y no implica relación, representación ni vínculo alguno con el Gobierno de los Estados Unidos.
              </li>
              <li>
                Ninguna comunicación, resultado, nota o certificado emitido por VIPRO deberá presentarse, invocarse o interpretarse como un documento oficial, una determinación gubernamental o una precalificación reconocida por autoridad consular o migratoria alguna.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-mono">3</span>
              <span>Naturaleza Informativa y No Vinculante del Resultado</span>
            </h2>
            <p>
              El porcentaje, nota o calificación que VIPRO entrega al finalizar la autoevaluación (en adelante, el &ldquo;Resultado&rdquo;) es un estimado referencial generado a partir de un modelo interno de valoración de respuestas. El Resultado:
            </p>
            <ul className="list-disc pl-6 space-y-2 marker:text-brand-primary">
              <li>
                No constituye una garantía, promesa, aseguramiento ni predicción certera de que el Usuario obtendrá, será elegible para, o aprobará una visa de no inmigrante de los Estados Unidos.
              </li>
              <li>
                No representa, refleja ni anticipa el criterio, la decisión ni el resultado que un funcionario consular pueda adoptar durante la entrevista consular o cualquier etapa del proceso de solicitud de visa.
              </li>
              <li>
                Puede variar significativamente respecto al resultado real obtenido por el Usuario, dado que la decisión final sobre el otorgamiento de una visa es discrecional y corresponde exclusivamente a la autoridad consular competente de los Estados Unidos, conforme a la legislación migratoria estadounidense vigente, la información presentada por el solicitante y demás factores que escapan al control y conocimiento de VIPRO.
              </li>
              <li>
                Debe entenderse únicamente como una referencia orientativa de apoyo a la preparación personal del Usuario, y no como un factor determinante, vinculante o predictivo del éxito de su proceso.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-mono">4</span>
              <span>Metodología de la Autoevaluación</span>
            </h2>
            <p>
              El Resultado se calcula con base exclusivamente en las respuestas que el propio Usuario proporciona al cuestionario de aproximadamente cien (100) preguntas. VIPRO no verifica, contrasta ni valida independientemente la veracidad, exactitud o completitud de dicha información ante ninguna fuente oficial o de terceros.
            </p>
            <p>
              En consecuencia, la precisión del Resultado depende directamente de la honestidad, exactitud y buena fe con que el Usuario complete la autoevaluación. Respuestas incompletas, imprecisas o inexactas pueden generar un Resultado que no corresponda a la situación real del Usuario.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-mono">5</span>
              <span>No Garantía de Resultado en la Entrevista Consular</span>
            </h2>
            <p>
              El Usuario reconoce y acepta expresamente que el Resultado obtenido en VIPRO no está sujeto a, no condiciona, ni guarda relación de causalidad con el éxito, aprobación, negación o cualquier otro desenlace de la entrevista consular u otra etapa del proceso de solicitud de visa ante la Embajada o Consulados de los Estados Unidos. La decisión final sobre el otorgamiento de la visa corresponde exclusivamente al funcionario consular competente, con base en los criterios, evidencia y normativa aplicable en el momento de dicho proceso.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-mono">6</span>
              <span>Limitación de Responsabilidad</span>
            </h2>
            <p>En la máxima medida permitida por la legislación aplicable, la Empresa no será responsable por:</p>
            <ul className="list-disc pl-6 space-y-2 marker:text-brand-primary">
              <li>
                Decisiones, actos u omisiones que el Usuario adopte con base en el Resultado obtenido en VIPRO, incluyendo la decisión de solicitar, programar o comparecer a una cita o entrevista de visa.
              </li>
              <li>
                La denegación, retraso, cancelación o cualquier resultado desfavorable relacionado con la solicitud de visa del Usuario ante la Embajada o Consulados de los Estados Unidos.
              </li>
              <li>
                Daños directos, indirectos, incidentales, consecuentes, lucro cesante o pérdida de oportunidad derivados del uso, imposibilidad de uso, o interpretación del Resultado o de cualquier contenido de VIPRO.
              </li>
              <li>
                Errores, inexactitudes o interrupciones temporales del Servicio, sin perjuicio de los esfuerzos razonables de la Empresa por mantener su correcto funcionamiento.
              </li>
            </ul>
            <p className="italic text-xs text-text-muted pt-1">
              El Servicio se ofrece &ldquo;tal cual&rdquo; (&ldquo;as is&rdquo;) y &ldquo;según disponibilidad&rdquo;, sin garantías de ningún tipo, expresas o implícitas, respecto a su exactitud, idoneidad para un fin particular o resultado esperado.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-mono">7</span>
              <span>Protección y Tratamiento de Datos Personales</span>
            </h2>
            <p>
              Para efectuar la autoevaluación, el Usuario proporcionará determinada información personal a través del cuestionario de VIPRO. La Empresa tratará dicha información conforme a su Política de Privacidad, la cual forma parte integral de estos Términos, y conforme a la normativa de protección de datos aplicable en El Salvador y, en su caso, en el país de residencia del Usuario dentro de Latinoamérica.
            </p>
            <ul className="list-disc pl-6 space-y-2 marker:text-brand-primary">
              <li>
                Los datos proporcionados serán utilizados únicamente para generar el Resultado de la autoevaluación y para los demás fines descritos en la Política de Privacidad (incluyendo, en su caso, el envío de comunicaciones relacionadas con el Servicio, si el Usuario lo autoriza).
              </li>
              <li>
                La Empresa implementará medidas de seguridad razonables para proteger la confidencialidad de la información proporcionada, sin que ello constituya una garantía absoluta frente a accesos no autorizados.
              </li>
              <li>
                El Usuario podrá ejercer sus derechos de acceso, rectificación, actualización o eliminación de sus datos personales conforme a los mecanismos indicados en la Política de Privacidad.
              </li>
              <li>
                <strong>Privacidad Garantizada:</strong> VIPRO no comparte, vende ni transfiere las respuestas del cuestionario a la Embajada, Consulados o cualquier entidad gubernamental de los Estados Unidos.
              </li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-mono">8</span>
              <span>Costos del Servicio</span>
            </h2>
            <p>
              El acceso a la autoevaluación de VIPRO podrá estar sujeto, en todo o en parte, al pago de una tarifa, según se indique de forma clara y previa al Usuario al momento de utilizar el Servicio. En caso de existir algún costo, este será comunicado antes de que el Usuario proceda con el pago correspondiente, y las condiciones de facturación, medios de pago y política de reembolsos, de aplicar, se detallarán en la sección correspondiente del sitio web o aplicación de VIPRO.
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-mono">9</span>
              <span>Propiedad Intelectual</span>
            </h2>
            <p>
              Todos los derechos de propiedad intelectual sobre VIPRO, incluyendo, sin limitación, el cuestionario, la metodología de valoración, el diseño, los textos, gráficos, logotipos, marcas, software y demás contenidos, son titularidad exclusiva de la Empresa o de sus licenciantes. Queda prohibida la reproducción, distribución, modificación o explotación total o parcial de dichos contenidos sin autorización previa y por escrito de la Empresa.
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-mono">10</span>
              <span>Obligaciones del Usuario</span>
            </h2>
            <p>El Usuario se compromete a:</p>
            <ul className="list-disc pl-6 space-y-2 marker:text-brand-primary">
              <li>
                Proporcionar información veraz, completa y actualizada al momento de responder el cuestionario, entendiendo que la precisión del Resultado depende directamente de ello.
              </li>
              <li>
                Utilizar VIPRO exclusivamente para fines lícitos y personales, absteniéndose de todo uso fraudulento, engañoso o contrario a estos Términos.
              </li>
              <li>
                No utilizar el Resultado de VIPRO como documento oficial, prueba, soporte o sustento ante la Embajada, Consulados u otra autoridad migratoria de los Estados Unidos.
              </li>
            </ul>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-mono">11</span>
              <span>Modificaciones a los Términos</span>
            </h2>
            <p>
              La Empresa se reserva el derecho de modificar, actualizar o complementar estos Términos en cualquier momento, con el fin de reflejar cambios en el Servicio, en la normativa aplicable o en sus prácticas operativas. Las modificaciones serán publicadas en el sitio web o aplicación de VIPRO e indicarán la fecha de su última actualización. El uso continuado del Servicio con posterioridad a dichas modificaciones implicará la aceptación de los Términos actualizados.
            </p>
          </section>

          {/* Section 12 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-mono">12</span>
              <span>Ley Aplicable y Jurisdicción</span>
            </h2>
            <p>
              Estos Términos se regirán e interpretarán de conformidad con las leyes de la República de El Salvador. Para cualquier controversia derivada de la interpretación, cumplimiento o ejecución de los presentes Términos, las partes se someten a los tribunales competentes de El Salvador, salvo que la normativa de protección al consumidor del país de residencia del Usuario dentro de Latinoamérica disponga expresamente un fuero distinto de carácter irrenunciable.
            </p>
          </section>

          {/* Section 13 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-mono">13</span>
              <span>Contacto</span>
            </h2>
            <p>
              Para consultas relacionadas con estos Términos, con el Servicio o con el tratamiento de datos personales, el Usuario puede comunicarse a través de nuestro correo soporte:{" "}
              <a href="mailto:soporte@todovisa.com" className="text-brand-primary font-bold hover:underline">
                soporte@todovisa.com
              </a>{" "}
              o visitando{" "}
              <Link href="/about-us" className="text-brand-primary font-bold hover:underline">
                todovisa.com/about-us
              </Link>.
            </p>
          </section>

          {/* Section 14 */}
          <section className="space-y-3 bg-brand-light/20 border border-brand-primary/20 rounded-xl p-5">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-mono">14</span>
              <span>Aceptación de los Términos</span>
            </h2>
            <p className="font-medium text-text-primary">
              Al marcar la casilla de aceptación, registrarse o utilizar de cualquier forma VIPRO, el Usuario manifiesta que ha leído, comprendido y aceptado íntegramente estos Términos y Condiciones, incluyendo de manera especial las secciones 2, 3, 5 y 6 relativas a la naturaleza informativa del Resultado, la ausencia de afiliación con el Gobierno de los Estados Unidos y la ausencia de garantía sobre el resultado de la entrevista consular.
            </p>
          </section>

          {/* Action button */}
          <div className="pt-6 flex justify-center">
            <Link
              href="/vipro-form"
              className="px-8 py-3.5 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 text-sm inline-flex items-center gap-2"
            >
              <span>Ir a la Evaluación VIPRO</span>
              <span>&rarr;</span>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
