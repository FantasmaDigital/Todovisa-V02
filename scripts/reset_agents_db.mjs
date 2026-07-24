import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env");
} catch (e) {
  // ignore if .env is missing or already loaded
}


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Faltan credenciales de Supabase en el archivo .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function resetAgentsAndAgencies() {
  console.log("🔄 Iniciando reseteo de agentes y relaciones de agencias en Supabase...");

  try {
    // 1. Limpiar la tabla agency_members
    const { error: membersErr } = await supabase
      .from("agency_members")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (membersErr) {
      console.warn("⚠️ Aviso al limpiar agency_members:", membersErr.message);
    } else {
      console.log("✅ Tabla agency_members reseteada (sub-agentes desvinculados).");
    }

    // 2. Limpiar la tabla agency_invitations
    const { error: invErr } = await supabase
      .from("agency_invitations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (invErr) {
      console.warn("⚠️ Aviso al limpiar agency_invitations:", invErr.message);
    } else {
      console.log("✅ Tabla agency_invitations reseteada.");
    }

    // 3. Limpiar solicitudes pendientes agency_client_requests
    const { error: reqErr } = await supabase
      .from("agency_client_requests")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (reqErr) {
      console.warn("⚠️ Aviso al limpiar agency_client_requests:", reqErr.message);
    } else {
      console.log("✅ Tabla agency_client_requests reseteada.");
    }

    // 4. Actualizar las solicitudes de agentes en agent_applications para ser de tipo 'individual' o 'agency'
    const { error: appErr } = await supabase
      .from("agent_applications")
      .update({ application_type: "individual" })
      .is("application_type", null);

    if (appErr) {
      console.warn("⚠️ Aviso al actualizar agent_applications:", appErr.message);
    } else {
      console.log("✅ Solicitudes de agentes homogenizadas a independientes (individual).");
    }

    console.log("🎉 Reseteo completado con éxito. Ahora solo existen roles directos de Agente o Agencia.");
  } catch (err) {
    console.error("❌ Error durante la ejecución del reseteo:", err);
  }
}

resetAgentsAndAgencies();
