import test from 'node:test';
import assert from 'node:assert/strict';

test('Inicio de Sesión Tradicional (Email / Password) - Sanitización y Validación', () => {
  const processSignInInput = (email: unknown, password: unknown) => {
    const sanitizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const sanitizedPassword = typeof password === 'string' ? password : '';

    if (!sanitizedEmail || !sanitizedPassword) {
      return { valid: false, error: 'Email y contraseña son requeridos' };
    }
    return { valid: true, email: sanitizedEmail, password: sanitizedPassword };
  };

  assert.equal(processSignInInput('  USUARIO@TODOVISA.COM  ', 'Password123').valid, true);
  assert.equal(processSignInInput('  USUARIO@TODOVISA.COM  ', 'Password123').email, 'usuario@todovisa.com');
  assert.equal(processSignInInput('', 'Password123').valid, false);
  assert.equal(processSignInInput('usuario@todovisa.com', '').valid, false);
});

test('Inicio de Sesión Tradicional - Prevención de Enumeración y Manejo de Errores', () => {
  const handleSignInResponse = (resOk: boolean, rawError?: string) => {
    if (!resOk) {
      // Prevención de enumeración de usuarios: mensaje homogéneo genérico
      return { success: false, error: 'Credenciales de acceso no válidas' };
    }
    return { success: true };
  };

  const failedLogin = handleSignInResponse(false, 'User not found in Supabase auth');
  assert.equal(failedLogin.success, false);
  assert.equal(failedLogin.error, 'Credenciales de acceso no válidas', 'Debe retornar mensaje genérico para evitar enumeración');
});

test('Registro de Usuario (Sign-Up) - Sanitización y Regla de Contraseña de 6+ Caracteres', () => {
  const processSignUpInput = (data: {
    email: unknown;
    password: unknown;
    first_name: unknown;
    last_name: unknown;
  }) => {
    const sanitizedEmail = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    const sanitizedPassword = typeof data.password === 'string' ? data.password : '';
    const sanitizedFirstName = typeof data.first_name === 'string' ? data.first_name.trim() : '';
    const sanitizedLastName = typeof data.last_name === 'string' ? data.last_name.trim() : '';

    if (!sanitizedEmail || !sanitizedPassword) {
      return { valid: false, error: 'Email y contraseña son requeridos' };
    }

    if (sanitizedPassword.length < 6) {
      return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    return {
      valid: true,
      data: {
        email: sanitizedEmail,
        password: sanitizedPassword,
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
      },
    };
  };

  const validRegistration = processSignUpInput({
    email: ' NUEVO.CLIENTE@TODOVISA.COM ',
    password: 'secreto123',
    first_name: ' Ana ',
    last_name: ' Martínez ',
  });

  assert.equal(validRegistration.valid, true);
  assert.equal(validRegistration.data?.email, 'nuevo.cliente@todovisa.com');
  assert.equal(validRegistration.data?.first_name, 'Ana');
  assert.equal(validRegistration.data?.last_name, 'Martínez');

  // Contraseña corta (< 6 caracteres) debe ser rechazada
  const shortPassRegistration = processSignUpInput({
    email: 'ana@todovisa.com',
    password: '12345',
    first_name: 'Ana',
    last_name: 'Martínez',
  });

  assert.equal(shortPassRegistration.valid, false);
  assert.equal(shortPassRegistration.error, 'La contraseña debe tener al menos 6 caracteres');
});

test('Autenticación Social con Google (OAuth Sign-In & Sign-Up)', () => {
  const prepareGoogleOAuthPayload = (origin: string) => {
    const redirectTo = `${origin}/`;
    return {
      provider: 'google' as const,
      options: {
        redirectTo,
      },
    };
  };

  const prodPayload = prepareGoogleOAuthPayload('https://todovisa.com');
  assert.equal(prodPayload.provider, 'google');
  assert.equal(prodPayload.options.redirectTo, 'https://todovisa.com/');

  const devPayload = prepareGoogleOAuthPayload('http://localhost:3000');
  assert.equal(devPayload.options.redirectTo, 'http://localhost:3000/');
});
