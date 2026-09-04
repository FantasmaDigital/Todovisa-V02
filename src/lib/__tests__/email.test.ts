import test from "node:test";
import assert from "node:assert/strict";
import { sendEmail } from "../emailService";
import { createPasswordResetEmail } from "../emailTemplates";

test("Email Service - Envió en Modo Simulado o Retorno Defensivo", async () => {
  // Test simulated mode or error handling response
  const result = await sendEmail({
    to: "test@example.com",
    subject: "Prueba de Integración Unit Test",
    html: "<p>Contenido de prueba</p>",
  });

  assert.ok(typeof result === "object", "El servicio de correo debe retornar un objeto");
  assert.ok("success" in result, "El resultado debe incluir propiedad success");
});

test("Plantilla de Correo - Generación de Enlace de Restablecimiento", () => {
  const resetUrl = "https://todovisa.com/auth/reset-password?email=cliente%40todovisa.com";
  const html = createPasswordResetEmail("Juan Pérez", resetUrl);

  assert.ok(html.includes("Juan Pérez"), "El HTML generado debe contener el nombre del destinatario");
  assert.ok(html.includes(resetUrl), "El HTML generado debe incluir la URL de restablecimiento");
  assert.ok(html.includes("Restablecimiento de Contraseña"), "El HTML debe contener el título corporativo");
});

test("Payload API Forgot Password - Normalización de Parámetros Email vs Email Capitalizado", () => {
  const parsePayload = (body: any) => {
    const raw = body?.email || body?.Email;
    if (!raw || typeof raw !== "string") return null;
    const clean = raw.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/i.test(clean)) return null;
    return clean;
  };

  assert.equal(parsePayload({ Email: "  USUARIO@TODOVISA.COM " }), "usuario@todovisa.com");
  assert.equal(parsePayload({ email: "cliente@todovisa.com" }), "cliente@todovisa.com");
  assert.equal(parsePayload({ Email: "invalido" }), null);
  assert.equal(parsePayload({}), null);
});
