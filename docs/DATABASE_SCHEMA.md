# 🗄️ Esquema de Base de Datos para Referidos de Empresa

## 1. Tabla: `public.agency_referral_leads`

Almacena todos los prospectos de clientes referidos mediante un código de empresa/agencia aliada que han completado el formulario de contacto para ser atendidos por un asesor propio de TodoVisa.

```sql
create table if not exists public.agency_referral_leads (
    id uuid default gen_random_uuid() primary key,
    client_name text not null,
    client_email text,
    client_phone text,
    visa_type text default 'Turismo (B1/B2)',
    destination_country text default 'Estados Unidos',
    agency_code text not null,
    agency_id text,
    agency_name text,
    notes text,
    status text not null default 'pending_advisor_contact', -- Estados: 'pending_advisor_contact', 'contacted', 'in_progress', 'completed'
    assigned_advisor text default 'Asesor Oficial TodoVisa',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Descripción de Columnas

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `uuid` | Identificador único de la solicitud del lead. |
| `client_name` | `text` | Nombre completo del cliente referido. |
| `client_email` | `text` | Correo electrónico de contacto del cliente. |
| `client_phone` | `text` | Teléfono / WhatsApp del cliente. |
| `visa_type` | `text` | Tipo de trámite o visa deseada (ej. Turismo B1/B2, F1, Trabajo). |
| `destination_country` | `text` | País de destino consular. |
| `agency_code` | `text` | Código de la empresa/agencia aliada mediante el cual ingresó. |
| `agency_id` | `text` | ID de la cuenta de usuario de la agencia (si está en la base de datos). |
| `agency_name` | `text` | Nombre comercial de la empresa/agencia aliada. |
| `notes` | `text` | Comentarios adicionales provistos por el cliente. |
| `status` | `text` | Estado de atención por el asesor de TodoVisa (`pending_advisor_contact`, `contacted`, `in_progress`, `completed`). |
| `assigned_advisor` | `text` | Identificador del asesor propio de TodoVisa a cargo. |
| `created_at` | `timestamptz` | Fecha y hora UTC en la que el cliente envió el formulario. |

---

## 2. Políticas de Seguridad RLS (Row Level Security)

```sql
alter table public.agency_referral_leads enable row level security;

-- Permitir inserciones desde el cliente (formulario público sin autenticación obligatoria)
create policy "Permitir inserciones públicas en agency_referral_leads" 
on public.agency_referral_leads
for insert with check (true);

-- Permitir lecturas de consulta
create policy "Permitir lecturas públicas en agency_referral_leads" 
on public.agency_referral_leads
for select using (true);

-- Permitir actualizaciones de estado por parte de los asesores de TodoVisa
create policy "Permitir actualizaciones públicas en agency_referral_leads" 
on public.agency_referral_leads
for update using (true);
```

---

## 3. Integración con Otras Tablas

- **`public.agent_applications`**: Utilizada por `/api/agency/validate-code` para verificar que el código `agency_code` pertenezca a una entidad corporativa/agencia validada.
- **`public.profiles`**: Almacena el rol `AGENCY` y en la metadata del usuario enlaza los campos `referred_by_agency_code`, `referred_by_agency_id` y `referred_by_agency_name`.
- **`public.messages`**: Utilizado como respaldo/fallback para registrar alertas en el chat interno cuando se genera un nuevo prospecto.
