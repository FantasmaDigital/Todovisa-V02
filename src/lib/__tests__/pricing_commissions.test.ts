import test from 'node:test';
import assert from 'node:assert/strict';
import { getSystemConfig, DEFAULT_PRICING } from '../../app/constants/config.js';

test('Configuración de Precios y Porcentajes por Defecto del Sistema', () => {
  const config = getSystemConfig();

  assert.equal(config.viproPrice, 19.99, 'El precio base de VIPRO debe ser $19.99');
  assert.equal(config.fullServicePrice, 100.00, 'El precio de Asesoría Completa debe ser $100.00');
  assert.equal(config.agentCommissionRate, 60, 'El porcentaje de comisión del Asesor debe ser 60%');
  assert.equal(config.agencyReferralRate, 20, 'El porcentaje de comisión de la Agencia Referida debe ser 20%');
});

test('Parseo de Porcentajes de Comisión (Conversión Decimal / Entero)', () => {
  const parseRate = (val: string | null, fallback: number) => {
    if (!val || isNaN(Number(val))) return fallback;
    const num = Number(val);
    return num > 0 && num < 1 ? Math.round(num * 100) : Math.round(num);
  };

  assert.equal(parseRate('0.2', 20), 20, 'Decimal 0.2 debe convertirse a 20%');
  assert.equal(parseRate('0.60', 60), 60, 'Decimal 0.60 debe convertirse a 60%');
  assert.equal(parseRate('20', 20), 20, 'Cadena "20" debe ser 20%');
  assert.equal(parseRate('60', 60), 60, 'Cadena "60" debe ser 60%');
  assert.equal(parseRate('invalid', 20), 20, 'Valor inválido debe retornar el fallback');
});

test('Reparto de Comisiones - Asesoría Completa ($100.00) con Asesor (60%) y Agencia (20%)', () => {
  const saleAmount = DEFAULT_PRICING.fullServicePrice; // $100.00
  const advisorRate = DEFAULT_PRICING.agentCommissionRate; // 60%
  const agencyRate = DEFAULT_PRICING.agencyReferralRate; // 20%

  const advisorAmount = (saleAmount * advisorRate) / 100; // $60.00
  const agencyAmount = (saleAmount * agencyRate) / 100; // $20.00
  const todoVisaShare = saleAmount - advisorAmount - agencyAmount; // $20.00

  assert.equal(advisorAmount, 60.00, 'La comisión del asesor debe ser exactamente $60.00');
  assert.equal(agencyAmount, 20.00, 'La comisión de la agencia debe ser exactamente $20.00');
  assert.equal(todoVisaShare, 20.00, 'El retorno neto de TodoVisa debe ser de $20.00 (20%)');
  assert.equal(advisorAmount + agencyAmount + todoVisaShare, saleAmount, 'La suma debe dar exactamente $100.00');
});

test('Reparto de Comisiones - Asesoría Completa ($100.00) solo con Asesor (60%) sin Agencia', () => {
  const saleAmount = DEFAULT_PRICING.fullServicePrice; // $100.00
  const advisorRate = DEFAULT_PRICING.agentCommissionRate; // 60%

  const advisorAmount = (saleAmount * advisorRate) / 100; // $60.00
  const todoVisaShare = saleAmount - advisorAmount; // $40.00

  assert.equal(advisorAmount, 60.00, 'La comisión del asesor debe ser de $60.00');
  assert.equal(todoVisaShare, 40.00, 'El retorno neto de TodoVisa debe ser de $40.00 (40%)');
  assert.equal(advisorAmount + todoVisaShare, saleAmount, 'La suma debe dar exactamente $100.00');
});

test('Reparto de Comisiones - Diagnóstico VIPRO ($19.99) con Agencia Referida (20%)', () => {
  const viproSale = DEFAULT_PRICING.viproPrice; // $19.99
  const agencyRate = DEFAULT_PRICING.agencyReferralRate; // 20%

  const agencyAmount = (viproSale * agencyRate) / 100; // $3.998
  const todoVisaShare = viproSale - agencyAmount; // $15.992

  const roundedAgencyAmount = Math.round(agencyAmount * 100) / 100; // 4.00
  const roundedTodoVisaShare = Math.round(todoVisaShare * 100) / 100; // 15.99

  assert.equal(roundedAgencyAmount, 4.00, 'La comisión de la agencia debe redondearse a $4.00');
  assert.equal(roundedTodoVisaShare, 15.99, 'El retorno neto de TodoVisa debe redondearse a $15.99');
  assert.equal(Math.round((agencyAmount + todoVisaShare) * 100) / 100, viproSale);
});

test('Asignación Manual de Comisión por Administrador (Override de Porcentaje)', () => {
  const calculateCustomCommission = (saleAmount: number, customRate: number) => {
    const commissionAmount = (saleAmount * customRate) / 100;
    const todovisaShare = saleAmount - commissionAmount;
    return {
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      todovisaShare: Math.round(todovisaShare * 100) / 100,
    };
  };

  // Ejemplo: Administrador asigna 25% de comisión personalizada a una agencia especial
  const result25 = calculateCustomCommission(100.00, 25);
  assert.equal(result25.commissionAmount, 25.00);
  assert.equal(result25.todovisaShare, 75.00);

  // Ejemplo: Administrador asigna 50% de comisión personalizada
  const result50 = calculateCustomCommission(100.00, 50);
  assert.equal(result50.commissionAmount, 50.00);
  assert.equal(result50.todovisaShare, 50.00);
});
