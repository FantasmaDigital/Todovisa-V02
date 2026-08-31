# 🔌 Documentación de las APIs de Referidos y Captación de Leads

## 1. Endpoint: Registrar Lead de Referido de Empresa

**URL:** `/api/agency/referral-lead`  
**Método:** `POST`  
**Encabezados:** `Content-Type: application/json`

### Parámetros de Entrada (Body JSON)

| Campo | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `client_name` | `string` | **Sí** | Nombre completo del cliente interesado. |
| `client_email` | `string` | Opcional* | Correo electrónico de contacto (*obligatorio si no hay teléfono). |
| `client_phone` | `string` | Opcional* | Número de teléfono o WhatsApp (*obligatorio si no hay correo). |
| `agency_code` | `string` | **Sí** | Código de referido de la empresa aliada. |
| `visa_type` | `string` | No | Tipo de visa (Ej: "Turismo (B1/B2)", "Visa de Estudiante"). |
| `destination_country` | `string` | No | País de destino (Ej: "Estados Unidos", "Canadá"). |
| `notes` | `string` | No | Comentarios adicionales o especificaciones del viaje. |

### Respuesta de Éxito (`200 OK`)

```json
{
  "success": true,
  "message": "Formulario de contacto enviado correctamente.",
  "leadId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "agencyName": "Agencia Viajes San Salvador",
  "agencyCode": "AGENCIA-SAN-SALVADOR",
  "advisorNote": "Un asesor propio de la empresa TodoVisa se pondrá en contacto a la brevedad para dar seguimiento y finalizar tu trámite consular."
}
```

### Respuestas de Error

- **`400 Bad Request`**: Datos incompletos o faltantes.
  ```json
  {
    "success": false,
    "error": "El nombre del cliente es obligatorio."
  }
  ```
- **`500 Internal Server Error`**: Falso fallo de base de datos o error de servidor.

---

## 2. Endpoint: Consultar Leads por Agencia

**URL:** `/api/agency/referral-lead?agency_code=CODIGO`  
**Método:** `GET`

### Respuesta de Éxito (`200 OK`)

```json
{
  "success": true,
  "leads": [
    {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "client_name": "María Fernanda López",
      "client_email": "mlopez@ejemplo.com",
      "client_phone": "+50370000000",
      "visa_type": "Turismo / Negocios (B1/B2)",
      "destination_country": "Estados Unidos",
      "agency_code": "AGENCIA-SAN-SALVADOR",
      "agency_name": "Agencia Viajes San Salvador",
      "status": "pending_advisor_contact",
      "assigned_advisor": "Asesor Oficial TodoVisa",
      "created_at": "2026-08-21T10:15:00.000Z"
    }
  ]
}
```

---

## 3. Endpoint: Validar Código de Agencia / Empresa

**URL:** `/api/agency/validate-code`  
**Método:** `POST`  
**Body:** `{"code": "AGENCIA-SAN-SALVADOR"}`

### Respuesta de Éxito (`200 OK`)

```json
{
  "valid": true,
  "agencyId": "uuid-de-la-agencia",
  "agencyName": "Agencia Viajes San Salvador",
  "code": "AGENCIA-SAN-SALVADOR"
}
```
