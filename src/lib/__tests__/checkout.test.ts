import test from 'node:test';
import assert from 'node:assert/strict';
import { getSystemConfig } from '../../app/constants/config.js';

test('Cálculo de Precios del Sistema (VIPRO vs Asesoría Completa)', () => {
  const config = getSystemConfig();

  assert.equal(typeof config.viproPrice, 'number', 'Precio VIPRO debe ser un número');
  assert.equal(typeof config.fullServicePrice, 'number', 'Precio de Asesoría Completa debe ser un número');

  assert.ok(config.viproPrice > 0, 'Precio VIPRO debe ser mayor a 0');
  assert.ok(config.fullServicePrice > config.viproPrice, 'Precio de Asesoría debe ser mayor al de VIPRO');
  assert.equal(config.agentCommissionRate, 60, 'La tasa de comisión del asesor debe ser del 60%');
  assert.equal(config.agencyReferralRate, 20, 'La tasa de comisión de agencia referida debe ser del 20%');
});

test('Flujo de Cálculo de Comisiones - Compra de Asesoría de Agente (60% Asesor / 20% Agencia)', () => {
  const config = getSystemConfig();
  const saleAmount = config.fullServicePrice; // 100.00

  // 1. Comisión del Asesor Asignado (60%)
  const advisorRate = config.agentCommissionRate; // 60%
  const advisorCommission = (saleAmount * advisorRate) / 100;

  // 2. Comisión de la Agencia Referida (20%)
  const agencyRate = config.agencyReferralRate; // 20%
  const agencyCommission = (saleAmount * agencyRate) / 100;

  // 3. Remanente neto para TodoVisa (20% si hay agencia + asesor)
  const todoVisaShare = saleAmount - advisorCommission - agencyCommission;

  assert.equal(advisorCommission, (saleAmount * 0.60), 'Comisión del asesor debe ser exactamente el 60%');
  assert.equal(agencyCommission, (saleAmount * 0.20), 'Comisión de la agencia debe ser exactamente el 20%');
  assert.ok(todoVisaShare > 0, 'El remanente neto de TodoVisa debe ser positivo');
  assert.equal(Math.round((advisorCommission + agencyCommission + todoVisaShare) * 100) / 100, saleAmount);
});

test('Flujo de Cálculo de Comisiones - Compra de VIPRO ($19.99)', () => {
  const config = getSystemConfig();
  const viproSale = config.viproPrice; // 19.99

  // Comisión de Agencia por Referido VIPRO (20%)
  const agencyRate = config.agencyReferralRate; // 20%
  const agencyCommission = (viproSale * agencyRate) / 100;
  const todoVisaShare = viproSale - agencyCommission;

  assert.equal(Math.round(agencyCommission * 100) / 100, Math.round((19.99 * 0.20) * 100) / 100);
  assert.equal(Math.round((agencyCommission + todoVisaShare) * 100) / 100, viproSale);
});

test('Actualización de Estado de Usuario tras Compra VIPRO', () => {
  const initialUser = {
    id: 'usr_123',
    email: 'cliente@todovisa.com',
    hasPaidVipro: false,
    hasPaidAdvisor: false,
  };

  const processViproPurchase = (userObj: typeof initialUser, txId: string) => {
    return {
      ...userObj,
      hasPaidVipro: true,
      last_paypal_tx: txId,
    };
  };

  const updatedUser = processViproPurchase(initialUser, 'PAYPAL_TX_VIPRO_999');

  assert.equal(updatedUser.hasPaidVipro, true, 'hasPaidVipro debe activarse como true');
  assert.equal(updatedUser.hasPaidAdvisor, false, 'hasPaidAdvisor permanece intacto');
  assert.equal(updatedUser.last_paypal_tx, 'PAYPAL_TX_VIPRO_999');
});

test('Actualización de Estado de Usuario tras Contratación de Agente', () => {
  const initialUser = {
    id: 'usr_456',
    email: 'cliente2@todovisa.com',
    hasPaidVipro: false,
    hasPaidAdvisor: false,
    assignedAgentId: null as string | null,
    assignedAgencyName: null as string | null,
  };

  const selectedAgent = {
    id: 'agent_777',
    name: 'Carlos Mendoza (Asesor Senior)',
    agencyName: 'TodoVisa El Salvador',
  };

  const processAdvisorPurchase = (userObj: typeof initialUser, agent: typeof selectedAgent, txId: string) => {
    return {
      ...userObj,
      hasPaidAdvisor: true,
      assignedAgentId: agent.id,
      assignedAgencyName: agent.agencyName,
      last_paypal_tx: txId,
    };
  };

  const updatedUser = processAdvisorPurchase(initialUser, selectedAgent, 'PAYPAL_TX_AGENT_888');

  assert.equal(updatedUser.hasPaidAdvisor, true, 'hasPaidAdvisor debe activarse como true');
  assert.equal(updatedUser.assignedAgentId, 'agent_777', 'Debe asignarse el ID del asesor contratado');
  assert.equal(updatedUser.assignedAgencyName, 'TodoVisa El Salvador', 'Debe vincularse el nombre de la agencia');
  assert.equal(updatedUser.last_paypal_tx, 'PAYPAL_TX_AGENT_888');
});

test('Validación y Sanitización de Código de Referido de Agencia', () => {
  const validateCode = (rawCode: string) => {
    const cleanCode = rawCode.trim().toUpperCase();
    if (!cleanCode) return { valid: false, error: 'Código vacío' };
    if (cleanCode.length < 3) return { valid: false, error: 'Código muy corto' };
    return { valid: true, cleanCode };
  };

  assert.equal(validateCode('  agencia-sv-01 ').cleanCode, 'AGENCIA-SV-01');
  assert.equal(validateCode('  ').valid, false);
  assert.equal(validateCode('a').valid, false);
});
