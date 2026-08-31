import test from 'node:test';
import assert from 'node:assert/strict';

test('Paso 1: Contratación de Asesor y Asignación de Cliente', () => {
  const clientProfile = {
    id: 'user_cli_101',
    email: 'cliente.viajero@todovisa.com',
    firstName: 'María',
    lastName: 'Gómez',
    hasPaidAdvisor: false,
    assignedAgentId: null as string | null,
    assignedAgencyName: null as string | null,
  };

  const selectedAgent = {
    id: 'agent_advisor_505',
    name: 'Licda. Sofia Ramirez',
    title: 'Consultora Senior de Visado EE.UU. & Canadá',
    agencyName: 'TodoVisa Global',
  };

  // Simulación de respuesta de pago exitoso vía CheckoutModal
  const hireAdvisor = (client: typeof clientProfile, agent: typeof selectedAgent) => {
    return {
      ...client,
      hasPaidAdvisor: true,
      assignedAgentId: agent.id,
      assignedAgencyName: agent.agencyName,
      last_paypal_tx: `TX_HIRE_${Date.now()}`,
    };
  };

  const updatedClient = hireAdvisor(clientProfile, selectedAgent);

  assert.equal(updatedClient.hasPaidAdvisor, true, 'hasPaidAdvisor debe activarse como true');
  assert.equal(updatedClient.assignedAgentId, 'agent_advisor_505', 'Debe asignarse el ID del asesor seleccionado');
  assert.equal(updatedClient.assignedAgencyName, 'TodoVisa Global', 'Debe relacionarse el nombre de la agencia');
  assert.ok(updatedClient.last_paypal_tx.startsWith('TX_HIRE_'), 'Debe generar código de transacción de pago');
});

test('Paso 2: Creación de Registro de Atencion (agency_client_requests)', () => {
  const createClientRequest = (clientId: string, agentId: string, clientName: string, clientEmail: string) => {
    return {
      id: `req_${Date.now()}`,
      agency_id: agentId,
      agent_hired_id: agentId,
      client_id: clientId,
      client_name: clientName,
      client_email: clientEmail,
      status: 'assigned' as const,
      created_at: new Date().toISOString(),
    };
  };

  const request = createClientRequest('user_cli_101', 'agent_advisor_505', 'María Gómez', 'cliente.viajero@todovisa.com');

  assert.equal(request.client_id, 'user_cli_101');
  assert.equal(request.agent_hired_id, 'agent_advisor_505');
  assert.equal(request.status, 'assigned', 'El estado del ticket debe iniciar como asignado');
  assert.ok(request.created_at, 'Debe contener fecha de creación ISO');
});

test('Paso 3: Flujo de Mensajería Bidireccional (Chat Cliente <-> Asesor)', () => {
  const chatHistory: any[] = [];

  const sendMessage = (sender: 'user' | 'agent', text: string, userId: string, agentId: string) => {
    const msg = {
      id: `msg_${Date.now()}_${Math.random()}`,
      sender,
      text,
      user_id: userId,
      agent_id: agentId,
      timestamp: new Date().toISOString(),
    };
    chatHistory.push(msg);
    return msg;
  };

  // 1. Cliente envía mensaje con dudas de pasaporte
  sendMessage('user', 'Hola Sofia, ya subí la foto de mi pasaporte al expediente.', 'user_cli_101', 'agent_advisor_505');
  
  // 2. Asesor responde confirmando recepción
  sendMessage('agent', '¡Hola María! Excelente, procedo a auditar tu pasaporte y documentos ahora mismo.', 'user_cli_101', 'agent_advisor_505');

  assert.equal(chatHistory.length, 2, 'El historial debe contener 2 mensajes');
  assert.equal(chatHistory[0].sender, 'user', 'El primer mensaje debe ser del cliente');
  assert.equal(chatHistory[1].sender, 'agent', 'El segundo mensaje debe ser del asesor');
  assert.ok(chatHistory[1].text.includes('auditar tu pasaporte'), 'Respuesta del asesor debe contener confirmación');
});

test('Paso 4: Auditoría de Expediente y Documentos por el Asesor', () => {
  const docReviews: Record<string, { status: 'approved' | 'observed' | 'rejected' | 'pending'; comment: string }> = {
    passport: { status: 'pending', comment: '' },
    dui: { status: 'pending', comment: '' },
    workCert: { status: 'pending', comment: '' },
    bankStatements: { status: 'pending', comment: '' },
  };

  const auditDocument = (docType: string, status: 'approved' | 'observed' | 'rejected', comment: string) => {
    docReviews[docType] = { status, comment };
  };

  // Asesor revisa y aprueba cada documento del cliente
  auditDocument('passport', 'approved', 'Pasaporte válido con vigencia superior a 2 años.');
  auditDocument('dui', 'approved', 'Documento de identidad legible.');
  auditDocument('workCert', 'approved', 'Constancia laboral membretada y sellada correctamente.');
  auditDocument('bankStatements', 'approved', 'Estados de cuenta reflejan solvencia económica suficiente.');

  const docKeys = ['passport', 'dui', 'workCert', 'bankStatements'];
  const allApproved = docKeys.every(key => docReviews[key].status === 'approved');

  const expedienteStatus = allApproved ? 'approved' : 'submitted';

  assert.equal(allApproved, true, 'Todos los documentos deben estar aprobados');
  assert.equal(expedienteStatus, 'approved', 'El estado global del expediente debe transicionar a Aprobado');
  assert.equal(docReviews.passport.comment, 'Pasaporte válido con vigencia superior a 2 años.');
});

test('Paso 5: Agendamiento y Confirmación de Cita / Simulacro Consular con Enlace Virtual', () => {
  const appointmentRequest = {
    client_id: 'user_cli_101',
    requested_date: '2026-09-15',
    requested_time: '10:00',
    status: 'pending' as 'pending' | 'confirmed' | 'rejected' | 'proposed',
    confirmed_date: null as string | null,
    confirmed_time: null as string | null,
    meeting_link: null as string | null,
    agent_notes: null as string | null,
  };

  // Asesor aprueba cita y provee enlace virtual Zoom / Google Meet
  const confirmAppointment = (appt: typeof appointmentRequest, meetingLink: string, notes: string) => {
    if (!meetingLink || !meetingLink.trim()) {
      throw new Error('Es obligatorio ingresar el enlace a la reunión virtual para confirmar la cita.');
    }

    return {
      ...appt,
      status: 'confirmed' as const,
      confirmed_date: appt.requested_date,
      confirmed_time: appt.requested_time,
      meeting_link: meetingLink,
      agent_notes: notes,
    };
  };

  const confirmedAppt = confirmAppointment(
    appointmentRequest,
    'https://meet.google.com/abc-defg-hij',
    'Cita y simulacro consular confirmado. Por favor conéctese puntual con su pasaporte a la mano.'
  );

  assert.equal(confirmedAppt.status, 'confirmed', 'La cita debe marcarse como confirmada');
  assert.equal(confirmedAppt.confirmed_date, '2026-09-15');
  assert.equal(confirmedAppt.confirmed_time, '10:00');
  assert.equal(confirmedAppt.meeting_link, 'https://meet.google.com/abc-defg-hij', 'Debe incluir el enlace a la videollamada');
  assert.ok(confirmedAppt.agent_notes?.includes('simulacro consular confirmado'));

  // Verificar rechazo si se intenta confirmar sin enlace de videollamada
  assert.throws(
    () => confirmAppointment(appointmentRequest, '', 'Notas sin link'),
    /Es obligatorio ingresar el enlace a la reunión virtual/
  );
});

test('Paso 6: Finalización de Servicio y Calificación del Asesor (Reseña de 1 a 5 estrellas)', () => {
  const saveAgentReview = (userId: string, agentId: string, rating: number, comment: string) => {
    if (rating < 1 || rating > 5) {
      throw new Error('La calificación debe estar entre 1 y 5 estrellas.');
    }

    return {
      rating,
      comment,
      created_at: new Date().toISOString(),
      user_id: userId,
      agent_id: agentId,
    };
  };

  const review = saveAgentReview('user_cli_101', 'agent_advisor_505', 5, 'Excelente atención de la Licda. Sofia, resolvió todas mis dudas y aprobó mi expediente a tiempo.');

  assert.equal(review.rating, 5, 'La calificación debe ser de 5 estrellas');
  assert.equal(review.user_id, 'user_cli_101');
  assert.equal(review.agent_id, 'agent_advisor_505');
  assert.ok(review.comment.includes('Excelente atención'), 'Debe guardar el comentario del usuario');
  assert.ok(review.created_at, 'Debe registrar el timestamp de la reseña');

  // Verificar rechazo en valor fuera de rango
  assert.throws(
    () => saveAgentReview('user_cli_101', 'agent_advisor_505', 0, 'Sin rating'),
    /La calificación debe estar entre 1 y 5 estrellas/
  );
});
