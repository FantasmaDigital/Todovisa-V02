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
    try {
      const { data, error } = await adminClient
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select();

      if (error) {
        // If error is due to missing physical column in Supabase profiles schema cache
        const isColumnError = error.message.includes("column") || error.code === "PGRST204" || error.message.includes("schema cache");
        if (isColumnError) {
          console.warn("[ProfileRepository.updateProfile] Column missing in profiles schema, redirecting to document_reviews JSONB column:", error.message);
          
          const { data: currentProf } = await adminClient
            .from("profiles")
            .select("document_reviews")
            .eq("id", userId)
            .maybeSingle();

          const currentReviews = (currentProf?.document_reviews && typeof currentProf.document_reviews === 'object') 
            ? { ...currentProf.document_reviews } 
            : {};
          
          const safeUpdates = { ...updates };
          
          if (safeUpdates.appointment_request !== undefined) {
            currentReviews.appointment_request = safeUpdates.appointment_request;
            delete safeUpdates.appointment_request;
          }
          if (safeUpdates.cita_details !== undefined) {
            currentReviews.cita_details = safeUpdates.cita_details;
            delete safeUpdates.cita_details;
          }
          if (safeUpdates.agent_review !== undefined) {
            currentReviews.agent_review = safeUpdates.agent_review;
            delete safeUpdates.agent_review;
          }

          // Dynamic fallback for any other column mentioned in error message
          const missingColMatch = error.message.match(/Could not find the '([^']+)' column/i);
          if (missingColMatch && missingColMatch[1] && safeUpdates[missingColMatch[1]] !== undefined) {
            const missingCol = missingColMatch[1];
            currentReviews[missingCol] = safeUpdates[missingCol];
            delete safeUpdates[missingCol];
          }
          
          safeUpdates.document_reviews = currentReviews;

          const { data: fallbackData, error: fallbackError } = await adminClient
            .from("profiles")
            .update(safeUpdates)
            .eq("id", userId)
            .select();

          if (fallbackError) throw new Error(fallbackError.message);
          return fallbackData;
        }
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
    const { data, error } = await supabase
      .from("agent_commissions")
      .select("*")
      .eq("agent_id", agentId)
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
