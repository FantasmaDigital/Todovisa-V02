/**
 * TodoVisa Brand Email Template Wrapper
 * Uses TodoVisa brand colors: #113E5F (Primary Dark Blue), #EFF6FF (Light Blue Accent), #FAFAFA (Background Main)
 */

interface BaseEmailProps {
  title: string;
  subtitle?: string;
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
}

export function renderEmailTemplate({
  title,
  subtitle,
  contentHtml,
  ctaText,
  ctaUrl,
  footerNote,
}: BaseEmailProps): string {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    body {
      margin: 0;
      padding: 0;
      background-color: #FAFAFA;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #FAFAFA;
      padding: 32px 16px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #E5E7EB;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #113E5F 0%, #0f3755 100%);
      padding: 36px 32px;
      text-align: center;
      color: #FFFFFF;
    }
    .header-logo {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #FFFFFF;
      margin: 0 0 8px 0;
      text-decoration: none;
      display: inline-block;
    }
    .header-logo span {
      color: #60A5FA;
    }
    .header-subtitle {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.85);
      margin: 0;
      font-weight: 500;
    }
    .content {
      padding: 36px 32px;
    }
    .content-title {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .content-text {
      font-size: 15px;
      line-height: 1.6;
      color: #4B5563;
      margin-bottom: 20px;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background-color: #EFF6FF;
      color: #113E5F;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }
    .badge-success {
      background-color: #D1FAE5;
      color: #065F46;
    }
    .badge-warning {
      background-color: #FEF3C7;
      color: #92400E;
    }
    .button-container {
      text-align: center;
      margin: 32px 0 24px 0;
    }
    .button {
      display: inline-block;
      background-color: #113E5F;
      color: #FFFFFF !important;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(17, 62, 95, 0.25);
      transition: background-color 0.2s ease;
    }
    .info-card {
      background-color: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-left: 4px solid #113E5F;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-card-title {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 8px 0;
    }
    .info-card-content {
      font-size: 14px;
      color: #4B5563;
      margin: 0;
      line-height: 1.5;
    }
    .steps-list {
      margin: 20px 0;
      padding: 0;
      list-style: none;
    }
    .step-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .step-number {
      background-color: #113E5F;
      color: #FFFFFF;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      margin-right: 12px;
      flex-shrink: 0;
    }
    .step-text {
      font-size: 14px;
      color: #374151;
      padding-top: 4px;
    }
    .footer {
      background-color: #F9FAFB;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #E5E7EB;
    }
    .footer-text {
      font-size: 12px;
      color: #9CA3AF;
      line-height: 1.5;
      margin: 0 0 8px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <a href="https://todovisa.com" class="header-logo">TODO<span>VISA</span></a>
        ${subtitle ? `<p class="header-subtitle">${subtitle}</p>` : ''}
      </div>

      <!-- Main Content -->
      <div class="content">
        <h1 class="content-title">${title}</h1>
        ${contentHtml}
        ${
          ctaText && ctaUrl
            ? `
        <div class="button-container">
          <a href="${ctaUrl}" class="button" target="_blank">${ctaText}</a>
        </div>
        `
            : ''
        }
        ${footerNote ? `<p class="content-text" style="font-size: 13px; color: #6B7280; font-style: italic; margin-top: 24px;">${footerNote}</p>` : ''}
      </div>

      <!-- Footer -->
      <div class="footer">
        <p class="footer-text">© ${currentYear} TodoVisa. Todos los derechos reservados.</p>
        <p class="footer-text">Este es un correo automático de notificación de tu proceso consular. Por favor no respondas directamente a este mensaje.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// 1. Account Creation Template
export function createAccountWelcomeEmail(name: string, email: string) {
  const title = `¡Bienvenido a TodoVisa, ${name}!`;
  const contentHtml = `
    <span class="badge badge-success">Cuenta Creada Exitosamente</span>
    <p class="content-text">
      Hola <strong>${name}</strong>, nos alegra enormemente acompañarte en tu proceso de trámite consular. Tu cuenta ha sido registrada con el correo: <strong>${email}</strong>.
    </p>
    <p class="content-text">
      Desde tu portal personal podrás gestionar tus solicitudes, realizar evaluaciones de viabilidad VIPRO, cargar tu documentación de manera 100% segura y chatear directamente con tu asesor consular asignado.
    </p>
    <div class="info-card">
      <div class="info-card-title">💡 Siguientes pasos recomendados</div>
      <p class="info-card-content">
        1. Accede a tu Perfil en TodoVisa.<br>
        2. Realiza tu diagnóstico de viabilidad consular VIPRO.<br>
        3. Elige a tu asesor experto para el llenado oficial de tus formularios.
      </p>
    </div>
  `;
  return renderEmailTemplate({
    title,
    subtitle: 'Tu Plataforma de Gestión Consular',
    contentHtml,
    ctaText: 'Ir a Mi Perfil',
    ctaUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/profile` : 'https://todovisa.com/profile',
  });
}

// 2. Password Reset Template
export function createPasswordResetEmail(name: string, resetUrl: string) {
  const title = `Restablecimiento de Contraseña`;
  const contentHtml = `
    <span class="badge badge-warning">Seguridad de la Cuenta</span>
    <p class="content-text">
      Hola ${name ? `<strong>${name}</strong>` : ''}, hemos recibido una solicitud para restablecer la contraseña de tu cuenta en TodoVisa.
    </p>
    <p class="content-text">
      Haz clic en el siguiente botón para definir una nueva contraseña. Por razones de seguridad, este enlace es válido por tiempo limitado.
    </p>
    <div class="info-card">
      <div class="info-card-title">⚠️ ¿No solicitaste este cambio?</div>
      <p class="info-card-content">
        Si no realizaste esta solicitud, puedes ignorar este correo con total tranquilidad. Tu contraseña actual seguirá siendo segura.
      </p>
    </div>
  `;
  return renderEmailTemplate({
    title,
    subtitle: 'Recuperación de Acceso',
    contentHtml,
    ctaText: 'Restablecer mi Contraseña',
    ctaUrl: resetUrl,
  });
}

// 3. VIPRO Purchase / Diagnostic Purchase Template
export function createViproPurchaseEmail(name: string, referenceId: string, amount: number) {
  const title = `¡Diagnóstico VIPRO Adquirido!`;
  const contentHtml = `
    <span class="badge badge-success">Compra Confirmada</span>
    <p class="content-text">
      Hola <strong>${name}</strong>, tu pago por la <strong>Evaluación de Viabilidad VIPRO</strong> ha sido procesado exitosamente.
    </p>
    <div class="info-card">
      <div class="info-card-title">🧾 Detalle de la Compra</div>
      <p class="info-card-content">
        <strong>Producto:</strong> Evaluación VIPRO Algorítmica<br>
        <strong>Referencia:</strong> ${referenceId}<br>
        <strong>Monto Pagado:</strong> $${amount.toFixed(2)} USD<br>
        <strong>Estado:</strong> Desbloqueado y Listo
      </p>
    </div>
    <p class="content-text">
      Tu diagnóstico VIPRO ha sido habilitado en tu panel de control. Puedes completar tu test de evaluación en cualquier momento para obtener tu puntaje de viabilidad consular de 0 a 100 puntos y tu análisis de riesgos 214(b).
    </p>
  `;
  return renderEmailTemplate({
    title,
    subtitle: 'Confirmación de Pago VIPRO',
    contentHtml,
    ctaText: 'Iniciar Evaluación VIPRO',
    ctaUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/vipro-form` : 'https://todovisa.com/vipro-form',
  });
}

// 4. Step Unlock / Process Progression Template
export function createStepUnlockedEmail(
  name: string,
  stepName: string,
  stepNumber: number,
  totalSteps: number,
  instructions: string
) {
  const title = `🎉 ¡Paso ${stepNumber} Desbloqueado: ${stepName}!`;
  const contentHtml = `
    <span class="badge">Avance de Servicio Completo (${stepNumber}/${totalSteps})</span>
    <p class="content-text">
      Hola <strong>${name}</strong>, ¡excelentes noticias! Tu proceso consular con acompañamiento experto ha avanzado al siguiente nivel.
    </p>
    <div class="info-card">
      <div class="info-card-title">📌 Nuevo Paso Activo: ${stepName}</div>
      <p class="info-card-content">
        ${instructions}
      </p>
    </div>
    <p class="content-text">
      Ingresa a tu portal para revisar las indicaciones de tu asesor consular y completar los requisitos de esta etapa.
    </p>
  `;
  return renderEmailTemplate({
    title,
    subtitle: 'Acompañamiento Consular Concierge',
    contentHtml,
    ctaText: 'Ver Avance de Mi Expediente',
    ctaUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/profile?tab=proceso` : 'https://todovisa.com/profile?tab=proceso',
  });
}

// 5. Checkout Abandonment Reminder Template (VIPRO or Full Service)
export function createCheckoutAbandonmentReminderEmail(
  name: string,
  serviceType: "vipro" | "advisor",
  viproPrice: number = 19.99,
  fullServicePrice: number = 49.99
) {
  const isVipro = serviceType === "vipro";
  const serviceTitle = isVipro ? "Evaluación Diagnóstica VIPRO" : "Asesoría Consular Completa (Servicio Concierge)";
  const price = isVipro ? viproPrice : fullServicePrice;
  const ctaUrl = isVipro
    ? (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/vipro-form` : "https://todovisa.com/vipro-form")
    : (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/agents` : "https://todovisa.com/agents");

  const title = `⌛ Recordatorio: Tu trámite consular te está esperando`;
  const contentHtml = `
    <span class="badge badge-warning">Proceso Incompleto</span>
    <p class="content-text">
      Hola <strong>${name || "Cliente TodoVisa"}</strong>, notamos que iniciaste el proceso de contratación para <strong>${serviceTitle}</strong> pero no completaste el pago en la pantalla de verificación.
    </p>
    <div class="info-card">
      <div class="info-card-title">📌 Resumen de tu solicitud reservada</div>
      <p class="info-card-content">
        <strong>Servicio:</strong> ${serviceTitle}<br>
        <strong>Monto:</strong> $${price.toFixed(2)} USD<br>
        <strong>Cobertura:</strong> Honorarios por asesoría personalizada y gestión (no incluye tasas de visado consulares MRV gubernamentales).
      </p>

    </div>
    <p class="content-text">
      Un perfil preparado a tiempo reduce drásticamente el riesgo de objeciones bajo la norma 214(b). Haz clic abajo para retomar tu checkout y habilitar tu servicio de inmediato.
    </p>
  `;

  return renderEmailTemplate({
    title,
    subtitle: "Recordatorio Semanal TodoVisa",
    contentHtml,
    ctaText: isVipro ? `Completar Pago VIPRO ($${price.toFixed(2)} USD)` : "Completar Asesoría Completa",
    ctaUrl,
    footerNote: "Recibes este recordatorio automatizado porque visitaste la pantalla de pago de TodoVisa. Si ya completaste tu compra o no deseas continuar, puedes ignorar este mensaje."
  });
}

// 6. OTP Code Verification Email Template
export function createOtpVerificationEmail(
  code: string,
  purpose: string = "verificación de cuenta",
  name: string = "Usuario"
) {
  const title = `Tu Código de Verificación OTP: ${code}`;
  const formattedCode = code.split('').join(' ');

  const contentHtml = `
    <span class="badge badge-success">Código de Verificación Seguro</span>
    <p class="content-text">
      Hola ${name ? `<strong>${name}</strong>` : 'estimado usuario'}, hemos generado tu código de verificación único para <strong>${purpose}</strong> en TodoVisa.
    </p>
    
    <div style="text-align: center; margin: 28px 0; padding: 24px; background: linear-gradient(135deg, #113E5F 0%, #1a4f77 100%); border-radius: 12px; box-shadow: 0 4px 14px rgba(17, 62, 95, 0.2);">
      <div style="font-size: 12px; text-transform: uppercase; tracking: 2px; color: #93C5FD; font-weight: 700; margin-bottom: 8px; letter-spacing: 2px;">
        Código de Seguridad OTP
      </div>
      <div style="font-size: 36px; font-weight: 800; color: #FFFFFF; letter-spacing: 12px; font-family: monospace; font-variant-numeric: tabular-nums;">
        ${formattedCode}
      </div>
      <div style="font-size: 12px; color: #E0F2FE; margin-top: 8px;">
        Válido por los próximos 10 minutos
      </div>
    </div>

    <div class="info-card">
      <div class="info-card-title">🔒 Indicaciones de Seguridad</div>
      <p class="info-card-content">
        • Ingresa este código numérico de 6 dígitos en la pantalla de verificación.<br>
        • Nunca compartas este código con nadie. El personal de TodoVisa jamás te pedirá tu código OTP.<br>
        • Si no solicitaste este código, te sugerimos ignorar este mensaje o cambiar tu contraseña.
      </p>
    </div>
  `;

  return renderEmailTemplate({
    title,
    subtitle: "Verificación de Seguridad TodoVisa",
    contentHtml,
    footerNote: "Recibes este correo automático porque se ha iniciado un proceso de autenticación o verificación en tu cuenta de TodoVisa."
  });
}

