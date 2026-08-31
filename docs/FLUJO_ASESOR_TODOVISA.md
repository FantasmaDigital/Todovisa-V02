# 👨‍💼 Flujo de Asesor Oficial TodoVisa y Asignación Manual de Comisión en Módulo Admin

## 1. Declaración del Procedimiento

Cuando un cliente ingresa mediante un enlace corporativo (`/referral?ref=CODIGO`) o código de empresa y envía sus datos de contacto:

1. **Atención Consular**: Un **asesor propio de la empresa TodoVisa** se pone en contacto directo con el cliente para responder sus dudas, revisar sus documentos y finalizar la solicitud consular.
2. **Pago y Asignación Manual**: Una vez que el cliente realiza el pago de su trámite, un usuario con rol Administrador accede al **Módulo de Administración** de TodoVisa (`admin_pagos`) y realiza la **asignación manual de la comisión del 20% a la empresa aliada**.

---

## 2. Pasos del Flujo de Trabajo

```mermaid
sequenceDiagram
    autonumber
    actor Cliente as Cliente Final
    participant Link as Enlace/Referido de Empresa (/referral?ref=CODIGO)
    participant API as API (/api/agency/referral-lead)
    actor Asesor as Asesor Oficial TodoVisa
    actor Admin as Administrador TodoVisa
    participant AdminModule as Módulo Admin (admin_pagos)
    participant DB as Supabase (agent_commissions)

    Cliente->>Link: Llena formulario de contacto con código de empresa
    Link->>API: POST /api/agency/referral-lead (guarda lead)
    API-->>Asesor: Notifica asignación de nuevo prospecto
    Asesor->>Cliente: Contacta al cliente y gestiona el trámite consular
    Cliente->>Asesor: Realiza el pago del servicio consular
    Admin->>AdminModule: Accede al Módulo Admin -> Historial de Pagos
    Admin->>AdminModule: Clic en "Asignar Comisión a Empresa (20%)"
    AdminModule->>DB: Inserta registro de comisión en agent_commissions (20%)
    DB-->>AdminModule: Acredita el balance a la empresa aliada
```

---

## 3. Asignación Manual de la Comisión (20%) desde el Módulo Admin

1. El Administrador navega al menú de usuario -> **Mi Perfil / Panel de Administración**.
2. Selecciona la pestaña **Historial Global de Pagos (`admin_pagos`)**.
3. Junto a la transacción del cliente o utilizando el botón superior **"+ Asignar Comisión a Empresa (20%)"**, abre el modal de asignación manual.
4. Selecciona la **Empresa / Agencia Aliada** registrada.
5. El sistema calcula automáticamente el **20% sobre el monto bruto** ($150.00 x 20% = $30.00 USD).
6. Al presionar **"Asignar Comisión"**, el monto ingresa inmediatamente al saldo acreditado de la empresa aliada.
