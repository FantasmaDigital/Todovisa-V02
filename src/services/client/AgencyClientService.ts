import { AuthService } from "@/app/service/AuthService";
import { getAuthHeaders } from "./AuthClientService";

export class AgencyClientService {
  static async validateAgencyCode(code: string): Promise<{
    valid: boolean;
    agencyId?: string;
    agencyName?: string;
    code?: string;
    error?: string;
  }> {
    try {
      const res = await fetch("/api/agency/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error("Error validando código de agencia:", err);
      return { valid: false, error: "Error conectando con el servidor" };
    }
  }

  /**
   * Guarda o valida el código de agencia en localStorage (si no hay sesión)
   * o hace merge inmediato guardándolo en Supabase (si hay sesión).
   */
  static async processAndStoreAgencyCode(code: string, userId?: string) {
    if (!code || typeof window === "undefined") return null;
    const cleanCode = code.trim();

    // 1. Validar el código primero con el backend para asegurarse de que pertenezca a una AGENCIA
    const validation = await this.validateAgencyCode(cleanCode);

    if (validation.valid && validation.agencyId) {
      // Guardar localmente
      localStorage.setItem("todovisa_agency_ref", validation.code || cleanCode);
      localStorage.setItem("todovisa_agency_info", JSON.stringify({
        agencyId: validation.agencyId,
        agencyName: validation.agencyName,
        code: validation.code || cleanCode
      }));

      // Si el usuario ya tiene sesión iniciada, sincronizar / hacer MERGE directo a Supabase
      if (userId) {
        try {
          await AuthService.updateUser({
            referred_by_agency_code: validation.code || cleanCode,
            referred_by_agency_id: validation.agencyId,
            referred_by_agency_name: validation.agencyName,
          });
          console.log("✅ Código de agencia enlazado exitosamente en Supabase (User Metadata).");
        } catch (e) {
          console.error("Error guardando referido en Supabase:", e);
        }
      }
      return validation;
    } else {
      console.warn("⚠️ Código de referido rechazado o inválido:", validation.error);
      return validation;
    }
  }

  /**
   * Ejecuta la fusión (merge) cuando un usuario inicia sesión.
   * Si existe un código guardado en localStorage y el usuario aún no tiene uno en Supabase,
   * o si se desea enlazar el código local activo, se persiste en Supabase metadata.
   */
  static async syncReferralOnLogin(user: any) {
    if (typeof window === "undefined" || !user || !user.id) return;

    const localCode = localStorage.getItem("todovisa_agency_ref");
    const localInfoStr = localStorage.getItem("todovisa_agency_info");

    const existingCodeInMetadata = user.user_metadata?.referred_by_agency_code || user.referred_by_agency_code;
    const existingAgencyIdInMetadata = user.user_metadata?.referred_by_agency_id || user.referred_by_agency_id;

    // Si ya hay código local o si queremos validar el que está guardado
    if (localCode) {
      let agencyId = existingAgencyIdInMetadata;
      let agencyName = user.user_metadata?.referred_by_agency_name;

      if (localInfoStr) {
        try {
          const parsed = JSON.parse(localInfoStr);
          agencyId = parsed.agencyId || agencyId;
          agencyName = parsed.agencyName || agencyName;
        } catch (e) {}
      }

      // Si no tenemos la información completa o se quiere re-validar
      if (!agencyId) {
        const validation = await this.validateAgencyCode(localCode);
        if (validation.valid && validation.agencyId) {
          agencyId = validation.agencyId;
          agencyName = validation.agencyName;
        }
      }

      if (agencyId) {
        try {
          await AuthService.updateUser({
            referred_by_agency_code: localCode,
            referred_by_agency_id: agencyId,
            referred_by_agency_name: agencyName || "Agencia Aliada",
          });
          console.log("✅ Referido local fusionado (merged) y guardado en Supabase tras login.");
        } catch (err) {
          console.error("Error sincronizando referido tras login:", err);
        }
      }
    } else if (existingCodeInMetadata) {
      // Si el usuario ya tenía un código guardado en Supabase, asegurar que quede en localStorage para autocompletar
      localStorage.setItem("todovisa_agency_ref", existingCodeInMetadata);
      if (existingAgencyIdInMetadata) {
        localStorage.setItem("todovisa_agency_info", JSON.stringify({
          agencyId: existingAgencyIdInMetadata,
          agencyName: user.user_metadata?.referred_by_agency_name || "Agencia Aliada",
          code: existingCodeInMetadata
        }));
      }
    }
  }

  /**
   * Envía el formulario de contacto cuando el cliente ingresa mediante un código de referido de empresa.
   * Al ser procesado, un asesor propio de TodoVisa contactará al cliente para finalizar el proceso.
   */
  static async submitReferralLead(data: {
    client_name: string;
    client_email?: string;
    client_phone?: string;
    visa_type?: string;
    destination_country?: string;
    agency_code: string;
    notes?: string;
  }): Promise<{
    success: boolean;
    message?: string;
    agencyName?: string;
    advisorNote?: string;
    error?: string;
  }> {
    try {
      const res = await fetch("/api/agency/referral-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      return result;
    } catch (err: any) {
      console.error("Error enviando lead de referido de empresa:", err);
      return {
        success: false,
        error: "Ocurrió un error al enviar tus datos. Inténtalo nuevamente o contáctanos por WhatsApp.",
      };
    }
  }

  static async getReferralLeads(): Promise<any[]> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/agency/referral-lead?_t=${Date.now()}`, {
        method: "GET",
        headers: {
          ...headers,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
        cache: "no-store",
      });
      const data = await res.json();
      return data.leads || [];
    } catch (err: any) {
      console.error("Error obteniendo leads de referidos:", err);
      return [];
    }
  }

  static async updateReferralLead(payload: {
    id: string;
    status?: string;
    commission_assigned?: boolean;
    notes?: string;
  }): Promise<any> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/agency/referral-lead", {
        method: "PATCH",
        headers: {
          ...headers,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error("Error actualizando lead de referido:", err);
      return { success: false, error: err.message };
    }
  }
}


