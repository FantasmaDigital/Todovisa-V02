import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  });
}

import { sendEmail } from '../emailService';

async function testFinalEmail() {
  console.log('Testing full sendEmail integration with Zoho Mail...');
  const result = await sendEmail({
    to: 'tuvisa@todovisa.com',
    subject: '¡Servicio de Envíos TodoVisa Confirmado!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #113E5F; border-radius: 10px;">
        <h2 style="color: #113E5F;">🎉 ¡Sistema de Envíos de Correo Verificado!</h2>
        <p>Los envíos de correo mediante <strong>Zoho Mail SMTP</strong> están funcionando al 100%.</p>
        <p>Fecha de verificación: <strong>${new Date().toLocaleString()}</strong></p>
      </div>
    `,
  });

  console.log('RESULTADO FINAL:', JSON.stringify(result, null, 2));
}

testFinalEmail();
