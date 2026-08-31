import test from 'node:test';
import assert from 'node:assert/strict';
import { createCheckoutAbandonmentReminderEmail } from '../emailTemplates.js';

test('Plantilla de Correo - Recordatorio de Checkout Abortado VIPRO', () => {
  const emailHtml = createCheckoutAbandonmentReminderEmail(
    'Juan Pérez',
    'vipro',
    19.99,
    49.99
  );

  assert.ok(typeof emailHtml === 'string', 'El HTML debe ser una cadena de texto');
  assert.ok(emailHtml.includes('Juan Pérez'), 'Debe incluir el nombre del cliente');
  assert.ok(emailHtml.includes('Evaluación Diagnóstica VIPRO'), 'Debe incluir el nombre del servicio VIPRO');
  assert.ok(emailHtml.includes('$19.99 USD'), 'Debe incluir el precio exacto de VIPRO');
  assert.ok(emailHtml.includes('vipro-form'), 'Debe contener el enlace CTA hacia la evaluación VIPRO');
  assert.ok(emailHtml.includes('Recordatorio Semanal TodoVisa'), 'Debe incluir el subtítulo de la marca');
});

test('Plantilla de Correo - Recordatorio de Checkout Abortado Servicio Completo', () => {
  const emailHtml = createCheckoutAbandonmentReminderEmail(
    'María Gómez',
    'advisor',
    19.99,
    49.99
  );

  assert.ok(typeof emailHtml === 'string', 'El HTML debe ser una cadena de texto');
  assert.ok(emailHtml.includes('María Gómez'), 'Debe incluir el nombre de la cliente');
  assert.ok(emailHtml.includes('Asesoría Consular Completa'), 'Debe incluir el nombre del servicio completo');
  assert.ok(emailHtml.includes('$49.99 USD'), 'Debe incluir el precio exacto del servicio completo');
  assert.ok(emailHtml.includes('agents'), 'Debe contener el enlace CTA hacia la selección de asesores');
});

test('Algoritmo de Seguimiento - Filtrado de Carritos Abortados y Control Semanal (7 días)', () => {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const now = new Date('2026-08-30T12:00:00.000Z');

  // Caso 1: Usuario que visitó checkout pero NO pagó y NUNCA se le ha enviado correo -> Debe enviarse
  const user1 = {
    id: 'user_1',
    email: 'cliente1@todovisa.com',
    user_metadata: {
      first_name: 'Carlos',
      last_checkout_viewed_at: '2026-08-29T10:00:00.000Z',
      last_checkout_product: 'vipro',
      has_paid_vipro: false,
      last_abandonment_reminder_sent_at: null,
    }
  };

  // Caso 2: Usuario que visitó checkout, NO pagó, pero se le envió un correo hace 3 días (< 7 días) -> Debe omitirse
  const user2 = {
    id: 'user_2',
    email: 'cliente2@todovisa.com',
    user_metadata: {
      first_name: 'Ana',
      last_checkout_viewed_at: '2026-08-20T10:00:00.000Z',
      last_checkout_product: 'advisor',
      has_paid_advisor: false,
      last_abandonment_reminder_sent_at: '2026-08-28T12:00:00.000Z', // hace 2 días
    }
  };

  // Caso 3: Usuario que visitó checkout, NO pagó, y se le envió correo hace 8 días (> 7 días) -> Debe enviarse
  const user3 = {
    id: 'user_3',
    email: 'cliente3@todovisa.com',
    user_metadata: {
      first_name: 'Roberto',
      last_checkout_viewed_at: '2026-08-10T10:00:00.000Z',
      last_checkout_product: 'vipro',
      has_paid_vipro: false,
      last_abandonment_reminder_sent_at: '2026-08-20T12:00:00.000Z', // hace 10 días
    }
  };

  // Caso 4: Usuario que visitó checkout y YA PAGÓ -> Debe omitirse totalmente
  const user4 = {
    id: 'user_4',
    email: 'cliente4@todovisa.com',
    user_metadata: {
      first_name: 'Sofia',
      last_checkout_viewed_at: '2026-08-25T10:00:00.000Z',
      last_checkout_product: 'vipro',
      has_paid_vipro: true, // YA PAGÓ
      last_abandonment_reminder_sent_at: null,
    }
  };

  // Función lógica del algoritmo de decisión de envío
  const shouldSendReminder = (user: any) => {
    const meta = user.user_metadata;
    if (!meta.last_checkout_viewed_at) return false;

    const isViproAbandoned = meta.last_checkout_product === 'vipro' && !meta.has_paid_vipro;
    const isAdvisorAbandoned = meta.last_checkout_product === 'advisor' && !meta.has_paid_advisor;
    if (!isViproAbandoned && !isAdvisorAbandoned) return false;

    if (meta.last_abandonment_reminder_sent_at) {
      const lastSentDate = new Date(meta.last_abandonment_reminder_sent_at);
      const timeDiff = now.getTime() - lastSentDate.getTime();
      if (timeDiff < SEVEN_DAYS_MS) {
        return false; // Omitir porque ya se le envió en los últimos 7 días
      }
    }

    return true; // Califica para envío de recordatorio
  };

  assert.equal(shouldSendReminder(user1), true, 'Usuario 1 debe recibir recordatorio');
  assert.equal(shouldSendReminder(user2), false, 'Usuario 2 debe ser omitido (recordatorio reciente en menos de 7 días)');
  assert.equal(shouldSendReminder(user3), true, 'Usuario 3 debe recibir recordatorio (pasaron más de 7 días)');
  assert.equal(shouldSendReminder(user4), false, 'Usuario 4 debe ser omitido (ya realizó el pago)');
});
