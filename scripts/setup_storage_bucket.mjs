import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env");
} catch (e) {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Faltan credenciales de Supabase en .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupBucket() {
  console.log("📦 Verificando/Creando bucket de almacenamiento 'client-documents' en Supabase...");
  
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.warn("⚠️ Aviso al listar buckets:", listError.message);
    } else {
      console.log("Buckets existentes:", buckets.map(b => b.name));
      const exists = buckets.some(b => b.name === "client-documents");
      if (!exists) {
        const { data, error } = await supabase.storage.createBucket("client-documents", {
          public: true,
          fileSizeLimit: 20971520, // 20MB
          allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "application/pdf"]
        });
        if (error) {
          console.warn("⚠️ No se pudo crear el bucket 'client-documents' vía API:", error.message);
        } else {
          console.log("✅ Bucket 'client-documents' creado exitosamente en Supabase Storage!");
        }
      } else {
        console.log("✅ Bucket 'client-documents' ya existe.");
      }
    }
  } catch (err) {
    console.error("Error en setupBucket:", err);
  }
}

setupBucket();
