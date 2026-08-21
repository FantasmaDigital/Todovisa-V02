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
    const idsToSearch = new Set<string>([agentId]);

    // Buscar perfil y aplicaciones vinculadas para obtener application_id, email, etc.
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", agentId)
      .maybeSingle();

    if (profile?.email) {
      idsToSearch.add(profile.email);
    }

    const { data: apps } = await supabase
      .from("agent_applications")
      .select("application_id, user_id, email, agency_id")
      .or(`user_id.eq.${agentId},application_id.eq.${agentId},email.eq.${profile?.email || agentId}`);

    apps?.forEach((a) => {
      if (a.user_id) idsToSearch.add(a.user_id);
      if (a.application_id) idsToSearch.add(a.application_id);
      if (a.agency_id) idsToSearch.add(a.agency_id);
      if (a.email) idsToSearch.add(a.email);
    });

    const idList = Array.from(idsToSearch);

    const { data, error } = await supabase
      .from("agent_commissions")
      .select("*")
      .in("agent_id", idList)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
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
