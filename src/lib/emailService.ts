import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"TodoVisa" <no-reply@todovisa.com>`;

  if (!host || !user || !pass) {
    console.log(`[Email Service - SIMULATED MODE]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`(Configure SMTP_HOST, SMTP_USER, SMTP_PASS en .env.local para envíos reales de correo)`);
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(`[Email Service - SENT] MessageId: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    const errorMsg = error?.response || error?.message || "Error desconocido al enviar correo";
    console.error(`[Email Service - ERROR] Failed to send email to ${to}:`, errorMsg);
    if (error?.code === 'EAUTH' || errorMsg.includes('554')) {
      console.warn(`[Email Service - WARNING] Error de autenticación SMTP (Zoho Mail 554). Verifica SMTP_USER / Contraseña de Aplicación en .env.local.`);
    }
    return { success: false, error: errorMsg, code: error?.code };
  }
}
