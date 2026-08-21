# 🏢 Sistema de Referidos de Empresa y Formulario de Contacto

## 1. Contexto y Requerimiento del Cliente

El cliente solicitó implementar un flujo específico para cuando una **empresa o agencia aliada** envía un código o enlace de referido a un cliente final:

> *"Cuando una empresa mande un código de referido, se envíe un formulario donde se me llenen los datos de contacto del cliente y lo envíe. Al enviarlo, un asesor propio de la empresa TodoVisa se pondrá en contacto con él para poder terminar el trámite."*

---

## 2. Descripción del Flujo Funcional

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente Final
    participant Link as Enlace/Modal Referido (?ref=CODIGO)
    participant Modal as Formulario (CompanyReferralModal)
    participant API as API (/api/agency/referral-lead)
    participant DB as Supabase (agency_referral_leads)
    actor Asesor as Asesor Oficial TodoVisa

    Cliente->>Link: Accede mediante URL de Referido o Código de Empresa
    Link->>Modal: Muestra Formulario de Contacto del Referido
    Cliente->>Modal: Llena Nombre, Email, Teléfono/WhatsApp, Visa y Comentarios
    Modal->>API: POST /api/agency/referral-lead
    API->>DB: Guarda lead con estado 'pending_advisor_contact'
    API-->>Modal: Retorna confirmación de recepción
    Modal-->>Cliente: "¡Formulario enviado! Un asesor de TodoVisa te contactará a la brevedad"
    DB-->>Asesor: Notificación del nuevo prospecto asignado
    Asesor->>Cliente: Contacta al cliente vía Teléfono/WhatsApp para finalizar el trámite consular
```

---

## 3. Componentes y Páginas Desarrolladas

### 3.1. `CompanyReferralModal.tsx`
- **Ubicación**: [`src/app/components/shared/CompanyReferralModal.tsx`](file:///c:/Users/ELECTRONICA-2001/Desktop/Todovisa-V02/src/app/components/shared/CompanyReferralModal.tsx)
- **Propósito**: Modal interactivo e intuitivo con diseño moderno que solicita:
  - Nombre completo del cliente.
  - Correo electrónico.
  - Número de teléfono o WhatsApp.
  - Tipo de trámite / Visa deseada (B1/B2, F1, Trabajo, Petición Familiar, etc.).
  - País de destino.
  - Código de la empresa (con validación automática en tiempo real que muestra el nombre oficial de la empresa).
  - Comentarios o notas adicionales.

### 3.2. Página Dedicada `/referral` y `/referido`
- **Ubicación**: 
  - [`src/app/referral/page.tsx`](file:///c:/Users/ELECTRONICA-2001/Desktop/Todovisa-V02/src/app/referral/page.tsx)
  - [`src/app/referido/page.tsx`](file:///c:/Users/ELECTRONICA-2001/Desktop/Todovisa-V02/src/app/referido/page.tsx)
- **Propósito**: Permite a las empresas enviar un enlace corporativo directo a sus clientes (ejemplo: `https://todovisa.com/referral?ref=EMPRESA_123` o `https://todovisa.com/referido?code=EMPRESA_123`).
- Al abrir la página, valida automáticamente la empresa aliada y presenta de forma directa la opción para llenar el formulario de contacto.

### 3.3. Integración en Navegador Global y Pasarela Checkout
- **Header**: En [`Header.tsx`](file:///c:/Users/ELECTRONICA-2001/Desktop/Todovisa-V02/src/app/components/shared/Header.tsx) se incluyó el botón **"🏢 Referido Empresa"** que permite abrir el formulario en cualquier momento si hay un código detectado o tipeado.
- **Checkout Modal**: En [`CheckoutModal.tsx`](file:///c:/Users/ELECTRONICA-2001/Desktop/Todovisa-V02/src/app/components/shared/CheckoutModal.tsx) se añadió un enlace directo:
  *"¿Prefieres llenar tus datos para ser contactado por un asesor propio de TodoVisa?"*.

---

## 4. Persistencia del Código de Referido y Comisión (20%)

El código de empresa capturado se almacena de forma redundante para asegurar la retribución del **20% de comisión por referido** (80% para TodoVisa):
1. `localStorage.setItem("todovisa_agency_ref", codigo)`
2. `localStorage.setItem("todovisa_agency_info", JSON.stringify({ agencyId, agencyName, code }))`
3. En la tabla `agency_referral_leads` en Supabase.
4. En los metadatos del usuario (`user_metadata.referred_by_agency_code`) al iniciar sesión o registrarse.

