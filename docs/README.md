# 📚 Documentación General de Cambios y Funcionalidades - TodoVisa V02

Bienvenido al centro de documentación de **TodoVisa V02**. Este directorio reúne las guías técnicas, especificaciones de arquitectura, flujos de trabajo y documentación del módulo de **Sistema de Referidos por Empresa, Captación de Clientes y Asignación Manual de Comisiones en el Módulo Admin**.

---

## 📂 Contenido de la Documentación

1. [**Sistema de Referidos de Empresa**](file:///c:/Users/ELECTRONICA-2001/Desktop/Todovisa-V02/docs/SISTEMA_REFERIDOS_EMPRESA.md)
   - Explicación detallada del requerimiento del cliente.
   - Flujo desde la emisión del enlace y código de referido por la empresa aliada hasta la recepción del formulario de contacto.
   - Adaptación al sistema de diseño estético oficial de TodoVisa.

2. [**Flujo del Asesor propio de TodoVisa y Asignación Manual de Comisión en Admin**](file:///c:/Users/ELECTRONICA-2001/Desktop/Todovisa-V02/docs/FLUJO_ASESOR_TODOVISA.md)
   - Protocolo de atención por asesores propios de TodoVisa.
   - Proceso de pago y **asignación manual de la comisión del 20% a la empresa desde el Módulo de Administración (`admin_pagos`)**.

3. [**Documentación Técnica de la API**](file:///c:/Users/ELECTRONICA-2001/Desktop/Todovisa-V02/docs/API_DOCUMENTATION.md)
   - Especificaciones de los endpoints `/api/agency/referral-lead` y `/api/agents/commissions`.

4. [**Esquema de Base de Datos y Supabase**](file:///c:/Users/ELECTRONICA-2001/Desktop/Todovisa-V02/docs/DATABASE_SCHEMA.md)
   - Definición de la tabla `agency_referral_leads` y `agent_commissions`.

---

## ⚡ Resumen Ejecutivo del Cambio Implementado

| Característica | Descripción |
| :--- | :--- |
| **Enlace y Código de Referido** | Las empresas entregan su enlace exclusivo (`/referral?ref=CODIGO`) a los clientes finales. El formulario de contacto se presenta directamente con el código vinculado. |
| **Diseño y Estilo Consistente** | La interfaz del formulario y del portal de referidos sigue estrictamente el sistema de diseño estético, paleta de colores (`brand-primary`, `border-border-light`, `background-main`) y tipografía oficial de TodoVisa. |
| **Atención por Asesor TodoVisa** | Un asesor propio de la empresa TodoVisa contacta al cliente final para dar seguimiento y finalizar el trámite consular. |
| **Asignación Manual en Módulo Admin** | Al concretarse el pago del servicio, un administrador asigna manualmente la comisión del **20% a la empresa aliada** desde la pestaña de Pagos (`admin_pagos`) en el Módulo Admin. |
