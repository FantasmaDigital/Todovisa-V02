import test from 'node:test';
import assert from 'node:assert/strict';

function isTabAllowedForRole(tabId: string, role: string | null): boolean {
  const isStaff = role === 'admin' || role === 'moderator';
  const isAgency = role === 'agency';
  const isAgent = role === 'agent';

  if (tabId.startsWith('admin_')) {
    if (tabId === 'admin_referidos') {
      return Boolean(isStaff || isAgency);
    }
    return Boolean(isStaff);
  }

  if (['comisiones', 'metodos_cobro', 'invitar_agentes'].includes(tabId)) {
    return Boolean(isStaff || isAgency || isAgent);
  }

  if (['chat_agente', 'mi_acreditacion'].includes(tabId)) {
    return Boolean(isStaff || isAgent);
  }

  if (['proceso', 'vipro', 'asesor', 'pagos', 'datos'].includes(tabId)) {
    return true; // Pestañas públicas / cliente
  }

  return true;
}

test('Evaluación de Pestañas del Menú para ROL ADMINISTRADOR (ADMIN / MODERATOR)', () => {
  const adminTabs = [
    'datos',
    'admin_dashboard',
    'admin_referidos',
    'admin_socios',
    'admin_usuarios',
    'admin_expedientes',
    'admin_vipro',
    'admin_pagos',
    'comisiones',
    'metodos_cobro',
  ];

  adminTabs.forEach((tab) => {
    assert.equal(isTabAllowedForRole(tab, 'admin'), true, `Admin debe poder acceder a ${tab}`);
    assert.equal(isTabAllowedForRole(tab, 'moderator'), true, `Moderador debe poder acceder a ${tab}`);
  });
});

test('Evaluación de Pestañas del Menú para ROL AGENCIA (AGENCY)', () => {
  const allowedAgencyTabs = ['datos', 'admin_referidos', 'invitar_agentes', 'comisiones', 'metodos_cobro'];
  const forbiddenAgencyTabs = ['admin_dashboard', 'admin_socios', 'admin_usuarios', 'admin_expedientes', 'admin_vipro', 'admin_pagos'];

  allowedAgencyTabs.forEach((tab) => {
    assert.equal(isTabAllowedForRole(tab, 'agency'), true, `Agencia debe tener acceso a ${tab}`);
  });

  forbiddenAgencyTabs.forEach((tab) => {
    assert.equal(isTabAllowedForRole(tab, 'agency'), false, `Agencia NO debe acceder a ${tab}`);
  });
});

test('Evaluación de Pestañas del Menú para ROL AGENTE / ASESOR (AGENT)', () => {
  const allowedAgentTabs = ['datos', 'chat_agente', 'mi_acreditacion', 'comisiones', 'metodos_cobro'];
  const forbiddenAgentTabs = [
    'admin_dashboard',
    'admin_referidos',
    'admin_socios',
    'admin_usuarios',
    'admin_expedientes',
    'admin_vipro',
    'admin_pagos',
  ];

  allowedAgentTabs.forEach((tab) => {
    assert.equal(isTabAllowedForRole(tab, 'agent'), true, `Agente debe tener acceso a ${tab}`);
  });

  forbiddenAgentTabs.forEach((tab) => {
    assert.equal(isTabAllowedForRole(tab, 'agent'), false, `Agente NO debe acceder a ${tab}`);
  });
});

test('Evaluación de Pestañas del Menú para ROL CLIENTE / USUARIO ESTÁNDAR (CLIENT)', () => {
  const allowedClientTabs = ['datos', 'proceso', 'vipro', 'asesor', 'pagos'];
  const forbiddenClientTabs = [
    'admin_dashboard',
    'admin_referidos',
    'admin_socios',
    'admin_usuarios',
    'admin_expedientes',
    'admin_vipro',
    'admin_pagos',
    'comisiones',
    'metodos_cobro',
    'invitar_agentes',
    'chat_agente',
  ];

  allowedClientTabs.forEach((tab) => {
    assert.equal(isTabAllowedForRole(tab, 'client'), true, `Cliente debe tener acceso a su pestaña ${tab}`);
    assert.equal(isTabAllowedForRole(tab, null), true, `Usuario invitado debe ver pestaña pública ${tab}`);
  });

  forbiddenClientTabs.forEach((tab) => {
    assert.equal(isTabAllowedForRole(tab, 'client'), false, `Cliente NO debe acceder a pestaña privada ${tab}`);
    assert.equal(isTabAllowedForRole(tab, null), false, `Usuario no autenticado NO debe acceder a pestaña privada ${tab}`);
  });
});
