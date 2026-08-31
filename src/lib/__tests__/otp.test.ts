import test from "node:test";
import assert from "node:assert/strict";
import { otpStore } from "../otpStore";

test("OTP - Generación de Código Numérico de 6 Dígitos", () => {
  otpStore.clearAll();
  const res = otpStore.generateOtp("usuario@todovisa.com", "test");

  assert.equal(res.canSend, true, "Debe permitir enviar el primer código OTP");
  assert.ok(res.code, "Debe generar una cadena de código");
  assert.equal(res.code?.length, 6, "El código OTP debe ser de exactamente 6 dígitos");
  assert.ok(/^\d{6}$/.test(res.code!), "El código OTP debe ser estrictamente numérico");
});

test("OTP - Verificación Correcta con Código Válido", () => {
  otpStore.clearAll();
  const genRes = otpStore.generateOtp("cliente@todovisa.com", "login");
  const code = genRes.code!;

  const verifyRes = otpStore.verifyOtp("cliente@todovisa.com", code, "login");
  assert.equal(verifyRes.valid, true, "La verificación debe ser exitosa con el código correcto");
  assert.ok(verifyRes.message?.includes("correctamente"), "Debe devolver mensaje de éxito");
});

test("OTP - Consumo Único (Single-Use) del Código Verificado", () => {
  otpStore.clearAll();
  const genRes = otpStore.generateOtp("singleuse@todovisa.com", "verify");
  const code = genRes.code!;

  // Primera verificación: éxito
  const first = otpStore.verifyOtp("singleuse@todovisa.com", code, "verify");
  assert.equal(first.valid, true);

  // Segunda verificación con el mismo código: falla por ser de un solo uso
  const second = otpStore.verifyOtp("singleuse@todovisa.com", code, "verify");
  assert.equal(second.valid, false, "El código OTP no debe ser reutilizable");
});

test("OTP - Manejo de Intentos Fallidos y Límite Máximo de 5 Fallos", () => {
  otpStore.clearAll();
  const genRes = otpStore.generateOtp("seguridad@todovisa.com", "reset");
  const correctCode = genRes.code!;
  const wrongCode = correctCode === "123456" ? "654321" : "123456";

  // Intentos 1 a 4 fallidos
  for (let i = 1; i <= 4; i++) {
    const failRes = otpStore.verifyOtp("seguridad@todovisa.com", wrongCode, "reset");
    assert.equal(failRes.valid, false);
    assert.ok(failRes.error?.includes(`${5 - i} intento`), `Intento ${i} debe indicar intentos restantes`);
  }

  // Intento 5 fallido: bloquea el código definitivamente
  const fifthFail = otpStore.verifyOtp("seguridad@todovisa.com", wrongCode, "reset");
  assert.equal(fifthFail.valid, false);

  // Intento posterior (incluso con código correcto): debe rebotar
  const postFail = otpStore.verifyOtp("seguridad@todovisa.com", correctCode, "reset");
  assert.equal(postFail.valid, false, "El código debe inhabilitarse tras 5 fallos acumulados");
});

test("OTP - Cooldown de Reenvío (60 Segundos de Espera)", () => {
  otpStore.clearAll();

  // Primer envío OK
  const first = otpStore.generateOtp("cooldown@todovisa.com", "test");
  assert.equal(first.canSend, true);

  // Intento inmediato de segundo envío: bloqueado por cooldown
  const second = otpStore.generateOtp("cooldown@todovisa.com", "test");
  assert.equal(second.canSend, false);
  assert.ok((second.remainingSeconds || 0) > 0, "Debe retornar segundos restantes de espera");
});
