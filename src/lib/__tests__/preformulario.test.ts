import test from 'node:test';
import assert from 'node:assert/strict';

test('Autoguardado Progresivo del Preformulario DS-160 por Pasos', () => {
  const preformDraftStorage: Record<string, any> = {};

  const savePreformStepProgress = (
    userId: string,
    destination: string,
    currentStep: number,
    stepData: Record<string, any>
  ) => {
    const key = `preform_progress_${destination}_${userId}`;
    const currentAnswers = preformDraftStorage[key] ? JSON.parse(preformDraftStorage[key]).formData : {};

    const updatedFormData = { ...currentAnswers, ...stepData };

    const payload = {
      userId,
      destination,
      currentStep,
      formData: updatedFormData,
      isCompleted: false,
      updated_at: new Date().toISOString(),
    };

    preformDraftStorage[key] = JSON.stringify(payload);
    return payload;
  };

  // Paso 1: Datos personales básicos
  const step1 = savePreformStepProgress('user_cli_303', 'US', 1, {
    fullName: 'Roberto Carlos Alvarenga',
    birthDate: '1988-11-25',
    passportNumber: 'N12345678',
  });

  assert.equal(step1.currentStep, 1);
  assert.equal(step1.isCompleted, false);
  assert.equal(step1.formData.fullName, 'Roberto Carlos Alvarenga');

  // Paso 2: Información laboral y financiera
  const step2 = savePreformStepProgress('user_cli_303', 'US', 2, {
    occupation: 'Ingeniero de Sistemas',
    monthlyIncome: 2500,
    employerName: 'Tech Solutions El Salvador',
  });

  assert.equal(step2.currentStep, 2);
  assert.equal(step2.formData.fullName, 'Roberto Carlos Alvarenga', 'Debe preservar los datos del Paso 1');
  assert.equal(step2.formData.monthlyIncome, 2500, 'Debe incorporar los datos del Paso 2');
});

test('Finalización del Preformulario (Envío Definitivo)', () => {
  const completePreformulario = (userId: string, fullFormData: Record<string, any>) => {
    if (!fullFormData.fullName || !fullFormData.passportNumber) {
      throw new Error('No se puede finalizar el preformulario sin datos esenciales.');
    }

    return {
      userId,
      formData: fullFormData,
      isCompleted: true,
      submitted_at: new Date().toISOString(),
      status: 'submitted_to_agent',
    };
  };

  const fullData = {
    fullName: 'Roberto Carlos Alvarenga',
    passportNumber: 'N12345678',
    occupation: 'Ingeniero de Sistemas',
    purposeOfTrip: 'Turismo y Conferencia',
    contactInUS: 'Hermano - Juan Alvarenga (Residente)',
  };

  const completedPreform = completePreformulario('user_cli_303', fullData);

  assert.equal(completedPreform.isCompleted, true);
  assert.equal(completedPreform.status, 'submitted_to_agent');
  assert.ok(completedPreform.submitted_at, 'Debe incluir timestamp de envío al agente');
});

test('Acceso y Visibilidad del Preformulario Completado para el Agente Asignado', () => {
  // Base de datos simulada de preformularios
  const dbPreformularios: Record<string, any> = {
    user_cli_303: {
      userId: 'user_cli_303',
      formData: {
        fullName: 'Roberto Carlos Alvarenga',
        passportNumber: 'N12345678',
        occupation: 'Ingeniero de Sistemas',
        monthlyIncome: 2500,
        purposeOfTrip: 'Turismo y Conferencia',
      },
      isCompleted: true,
      submitted_at: '2026-08-29T14:00:00Z',
    },
  };

  // Método usado por el Agente para consultar el Preformulario del cliente asignado
  const getAgentClientPreform = (agentId: string, clientUserId: string, isAssignedAgentOrStaff: boolean) => {
    if (!isAssignedAgentOrStaff) {
      throw new Error('Acceso no autorizado al preformulario del cliente.');
    }

    const preform = dbPreformularios[clientUserId];
    if (!preform) {
      return { found: false, data: null };
    }

    return {
      found: true,
      data: preform,
      agentInspectedAt: new Date().toISOString(),
    };
  };

  // 1. Asesor asignado consulta el preformulario del cliente
  const agentInspection = getAgentClientPreform('agent_advisor_505', 'user_cli_303', true);

  assert.equal(agentInspection.found, true);
  assert.equal(agentInspection.data.formData.fullName, 'Roberto Carlos Alvarenga');
  assert.equal(agentInspection.data.formData.passportNumber, 'N12345678');
  assert.equal(agentInspection.data.isCompleted, true);
  assert.ok(agentInspection.agentInspectedAt, 'Debe registrar la inspección por parte del agente');

  // 2. Intento de acceso no autorizado por un usuario ajeno
  assert.throws(
    () => getAgentClientPreform('unauthorized_user', 'user_cli_303', false),
    /Acceso no autorizado al preformulario del cliente/
  );
});
