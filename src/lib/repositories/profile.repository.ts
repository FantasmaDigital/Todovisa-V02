import supabase from "@/app/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// Admin client with service role — bypasses RLS for server-side writes (used by advisor audit)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceKey) {
    console.warn("[ProfileRepository] SUPABASE_SERVICE_ROLE_KEY not set — using anon client (RLS may block writes)");
    return supabase;
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export class ProfileRepository {
  static async getProfileById(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getAllProfiles() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async updateProfile(userId: string, updates: Record<string, any>) {
    const adminClient = getAdminClient();

    const PHYSICAL_COLUMNS = new Set([
      'id', 'email', 'first_name', 'last_name', 'role', 'updated_at',
      'photo_url', 'phone', 'bio', 'location', 'staff_size',
      'expediente_status', 'client_docs', 'document_reviews',
      'ds160_full_name', 'ds160_passport_num', 'ds160_birth_date',
      'ds160_purpose_of_trip', 'ds160_has_assets', 'ds160_confirmed'
    ]);

    try {
      const directUpdates: Record<string, any> = {};
      const customMetadata: Record<string, any> = {};

      for (const [key, val] of Object.entries(updates)) {
        if (PHYSICAL_COLUMNS.has(key)) {
          directUpdates[key] = val;
        } else {
          customMetadata[key] = val;
        }
      }

      if (Object.keys(customMetadata).length > 0) {
        const { data: currentProf } = await adminClient
          .from("profiles")
          .select("document_reviews")
          .eq("id", userId)
          .maybeSingle();

        const currentReviews = (currentProf?.document_reviews && typeof currentProf.document_reviews === 'object')
          ? { ...currentProf.document_reviews }
          : {};

        const existingDocReviews = directUpdates.document_reviews || {};
        directUpdates.document_reviews = {
          ...currentReviews,
          ...existingDocReviews,
          ...customMetadata
        };
      }

      if (!directUpdates.updated_at) {
        directUpdates.updated_at = new Date().toISOString();
      }

      const { data, error } = await adminClient
        .from("profiles")
        .update(directUpdates)
        .eq("id", userId)
        .select();

      if (error) {
        console.error("[ProfileRepository.updateProfile Error]", error);
        throw new Error(error.message);
      }
      return data;
    } catch (err: any) {
      console.error("[ProfileRepository.updateProfile Catch]", err);
      throw err;
    }
  }

  static async getCommissionsByAgentId(agentId: string) {
    if (!agentId) return [];

    const isUuidCheck = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
    const idsToSearch = new Set<string>([agentId]);
    const dbClient = getAdminClient();

    // 1. Obtener email y datos del perfil si el id es UUID o email
    let userEmail = "";
    if (isUuidCheck(agentId)) {
      const { data: profile } = await dbClient
        .from("profiles")
        .select("id, email")
        .eq("id", agentId)
        .maybeSingle();

      if (profile?.email) {
        userEmail = profile.email;
        idsToSearch.add(profile.email);
      }
    } else if (agentId.includes("@")) {
      userEmail = agentId;
      idsToSearch.add(agentId);
    }

    // 2. Buscar aplicaciones por CUALQUIER identificador (application_id, user_id, agency_id, id, email)
    const orConditions = [`application_id.eq.${agentId}`, `user_id.eq.${agentId}`, `agency_id.eq.${agentId}`, `id.eq.${agentId}`];
    if (userEmail) {
      orConditions.push(`email.eq.${userEmail}`);
    }

    const { data: apps } = await dbClient
      .from("agent_applications")
      .select("id, application_id, user_id, email, agency_id")
      .or(orConditions.join(","));

    apps?.forEach((a) => {
      if (a.id) idsToSearch.add(a.id);
      if (a.user_id) idsToSearch.add(a.user_id);
      if (a.application_id) idsToSearch.add(a.application_id);
      if (a.agency_id) idsToSearch.add(a.agency_id);
      if (a.email) {
        idsToSearch.add(a.email);
        if (!userEmail) userEmail = a.email;
      }
    });

    // 3. Si tenemos email, buscar profile ID correspondiente
    if (userEmail) {
      const { data: profByEmail } = await dbClient
        .from("profiles")
        .select("id, email")
        .eq("email", userEmail)
        .maybeSingle();
      if (profByEmail?.id) idsToSearch.add(profByEmail.id);
    }

    // 4. Buscar en agency_referral_leads por agency_code, agency_id o id
    const { data: leads } = await dbClient
      .from("agency_referral_leads")
      .select("id, agency_id, agency_code")
      .or(`agency_code.eq.${agentId},agency_id.eq.${agentId},id.eq.${agentId}`);

    leads?.forEach((l) => {
      if (l.agency_id) idsToSearch.add(l.agency_id);
      if (l.agency_code) idsToSearch.add(l.agency_code);
    });

    // 5. Filtrar UUIDs válidos para hacer la consulta directa por agent_id
    const validUuids = Array.from(idsToSearch).filter(isUuidCheck);

    let commissionsMap = new Map<string, any>();

    if (validUuids.length > 0) {
      const { data, error } = await dbClient
        .from("agent_commissions")
        .select("*")
        .in("agent_id", validUuids)
        .order("created_at", { ascending: false });

      if (!error && data) {
        data.forEach((c) => commissionsMap.set(c.id, c));
      }
    }

    // 6. Consulta exhaustiva fallback por notas o coincidencias parciales de IDs/emails
    const { data: allComms } = await dbClient
      .from("agent_commissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (allComms) {
      const searchTerms = Array.from(idsToSearch).filter(Boolean);
      allComms.forEach((c) => {
        if (commissionsMap.has(c.id)) return;

        const notesStr = typeof c.notes === "string" ? c.notes : JSON.stringify(c.notes || {});
        const matchesAgentId = c.agent_id && idsToSearch.has(c.agent_id);
        const matchesNotes = searchTerms.some((term) => term && notesStr.includes(term));

        if (matchesAgentId || matchesNotes) {
          commissionsMap.set(c.id, c);
        }
      });
    }

    return Array.from(commissionsMap.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  }


  static async getPayoutsByAgentId(agentId: string) {
    const { data, error } = await supabase
      .from("agent_payouts")
      .select("*")
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async getAgencyMembers(agencyId: string) {
    const { data, error } = await supabase
      .from("agency_members")
      .select("*, profile:profiles!member_id(first_name, last_name, email)")
      .eq("agency_id", agencyId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async getAgencyInvitations(agencyId: string) {
    const { data, error } = await supabase
      .from("agency_invitations")
      .select("*")
      .eq("agency_id", agencyId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async createAgencyInvitation(invitationData: Record<string, any>) {
    const { data, error } = await supabase
      .from("agency_invitations")
      .insert(invitationData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getAgencyMemberInfo(userId: string) {
    // First query: check if this user is a member of any agency (fast single-row lookup)
    const { data: memberData } = await supabase
      .from("agency_members")
      .select("agency_id, member_role")
      .eq("member_id", userId)
      .maybeSingle();

    // Second query only fires when the user actually belongs to an agency — skipped for regular users
    if (memberData?.agency_id) {
      const { data: agencyProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", memberData.agency_id)
        .maybeSingle();
      return { memberData, agencyProfile };
    }

    return { memberData: null, agencyProfile: null };
  }
}
