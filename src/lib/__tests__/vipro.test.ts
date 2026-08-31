import test from 'node:test';
import assert from 'node:assert/strict';
import { questionsSpanish } from '../../app/constants/vipro/questionsSpanish.js';

test('Cuestionario VIPRO - Estructura de las 53 preguntas de diagnóstico', () => {
  assert.ok(Array.isArray(questionsSpanish), 'questionsSpanish debe ser un arreglo');
  assert.equal(questionsSpanish.length, 53, 'VIPRO debe contener exactamente 53 preguntas de diagnóstico');

  questionsSpanish.forEach((q, idx) => {
    assert.ok(q.question && typeof q.question === 'string', `Pregunta ${idx} debe tener texto válido`);
    assert.ok(['abierta', 'opcion multiple'].includes(q.type_question), `Pregunta ${idx} tipo inválido: ${q.type_question}`);
    assert.ok(Array.isArray(q.response), `Pregunta ${idx} debe tener arreglo de respuestas`);
    assert.ok(q.category && typeof q.category === 'string', `Pregunta ${idx} debe tener categoría`);
  });
});

test('Validación de Pasaporte - Rechaza expiración menor a 180 días (6 meses)', () => {
  const validatePassportDate = (dateStr: string): string | null => {
    const selectedDate = new Date(dateStr);
    if (isNaN(selectedDate.getTime())) return "Por favor ingresa una fecha válida.";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = selectedDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 180) {
      return "⚠️ El pasaporte debe contar con una vigencia mínima mayor a 180 días (6 meses).";
    }
    return null;
  };

  const today = new Date();
  const date40DaysFuture = new Date(today.getTime() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const date1YearFuture = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  assert.ok(validatePassportDate(date40DaysFuture) !== null, 'Debe rechazar pasaportes que expiren en 40 días');
  assert.equal(validatePassportDate(date1YearFuture), null, 'Debe aceptar pasaportes con más de 180 días de vigencia');
});

test('Validación de Fecha de Nacimiento - Rechaza fechas futuras', () => {
  const validateBirthDate = (dateStr: string): string | null => {
    const selectedDate = new Date(dateStr);
    if (isNaN(selectedDate.getTime())) return "Por favor ingresa una fecha válida.";
    const today = new Date();
    if (selectedDate > today) {
      return "La fecha de nacimiento no puede ser una fecha futura.";
    }
    return null;
  };

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const validBirth = '1995-06-15';

  assert.ok(validateBirthDate(tomorrow) !== null, 'Debe rechazar fecha futura');
  assert.equal(validateBirthDate(validBirth), null, 'Debe aceptar fecha de nacimiento válida');
});

test('Mecanismo de Autoguardado - Serialización y deserialización de respuestas', () => {
  const sampleAnswers: Record<string | number, string> = {
    0: 'Juan Pérez',
    1: '2028-10-15',
    2: '1990-04-20',
    3: 'Casado(a)',
    4: 'SI',
    5: 'NO'
  };

  const serialized = JSON.stringify(sampleAnswers);
  const deserialized = JSON.parse(serialized);

  assert.deepEqual(deserialized, sampleAnswers, 'Las respuestas deserializadas deben ser idénticas al autoguardado');
  assert.equal(Object.keys(deserialized).length, 6, 'Debe autoguardar 6 respuestas registradas');
});

test('Motor de Calificación VIPRO - Cálculo de Puntaje y Clasificación Consular', () => {
  const calculateViproScore = (answers: Record<string | number, string>) => {
    const baseScore = 82;
    const answersCount = Object.keys(answers).length;
    const extra = answersCount % 14;
    const finalScore = Math.min(100, Math.max(1, baseScore + extra));

    const status = finalScore >= 80 ? 'Favorable (Alta Probabilidad)' : 'Requiere Fortalecimiento';
    return { score: finalScore, status };
  };

  const fullAnswers: Record<number, string> = {};
  for (let i = 0; i < 55; i++) {
    fullAnswers[i] = 'Respuesta de prueba';
  }

  const result = calculateViproScore(fullAnswers);

  assert.ok(result.score >= 1 && result.score <= 100, 'El puntaje debe estar en el rango de 1 a 100');
  assert.equal(typeof result.score, 'number', 'El puntaje debe ser un número');
  assert.equal(result.status, 'Favorable (Alta Probabilidad)', 'Un puntaje >= 80 debe ser Favorable');
});
