import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit } from '../rateLimit.js';

test('Rate Limiter - permite solicitudes dentro del límite', () => {
  const identifier = `test-user-${Date.now()}`;
  const options = { windowMs: 60000, max: 3 };

  const res1 = checkRateLimit(identifier, options);
  assert.equal(res1.allowed, true);
  assert.equal(res1.remaining, 2);

  const res2 = checkRateLimit(identifier, options);
  assert.equal(res2.allowed, true);
  assert.equal(res2.remaining, 1);

  const res3 = checkRateLimit(identifier, options);
  assert.equal(res3.allowed, true);
  assert.equal(res3.remaining, 0);

  // Cuarta solicitud debe ser bloqueada (429)
  const res4 = checkRateLimit(identifier, options);
  assert.equal(res4.allowed, false);
  assert.equal(res4.remaining, 0);
  assert.ok(res4.resetMs > 0);
});

test('Sanitización de Email - remueve espacios y convierte a minúsculas', () => {
  const sanitizeEmail = (email: string) => (typeof email === 'string' ? email.trim().toLowerCase() : '');

  assert.equal(sanitizeEmail('  USER@Domain.COM  '), 'user@domain.com');
  assert.equal(sanitizeEmail('CLIENTE@TODOVISA.ES'), 'cliente@todovisa.es');
  assert.equal(sanitizeEmail(''), '');
});

test('Validación de Permisos de Rol para Pestañas de Perfil', () => {
  const isTabAllowed = (tabParam: string, role: string | null) => {
    const isStaff = role === 'admin' || role === 'moderator';
    const isAgency = role === 'agency';
    const isAgent = role === 'agent';

    if (tabParam.startsWith('admin_')) {
      if (tabParam === 'admin_referidos') {
        return Boolean(isStaff || isAgency);
      }
      return Boolean(isStaff);
    }
    if (['comisiones', 'metodos_cobro', 'invitar_agentes'].includes(tabParam)) {
      return Boolean(isStaff || isAgency || isAgent);
    }
    return true;
  };

  // Roles Admin/Moderator deben acceder a todas las pestañas admin
  assert.equal(isTabAllowed('admin_dashboard', 'admin'), true);
  assert.equal(isTabAllowed('admin_usuarios', 'moderator'), true);

  // Rol Agency debe acceder únicamente a admin_referidos entre las admin_
  assert.equal(isTabAllowed('admin_referidos', 'agency'), true);
  assert.equal(isTabAllowed('admin_dashboard', 'agency'), false);
  assert.equal(isTabAllowed('admin_usuarios', 'agency'), false);

  // Rol Cliente NO debe acceder a ninguna pestaña admin
  assert.equal(isTabAllowed('admin_referidos', 'client'), false);
  assert.equal(isTabAllowed('admin_dashboard', 'client'), false);
  assert.equal(isTabAllowed('admin_usuarios', 'client'), false);
  assert.equal(isTabAllowed('admin_vipro', null), false);
});
