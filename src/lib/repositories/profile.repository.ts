import supabase from "@/app/lib/supabase";

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

  static async updateProfile(userId: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (error) throw new Error(error.message);
    return data;
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
      .select("*, profile:profiles(first_name, last_name, email)")
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
    const { data: memberData } = await supabase
      .from("agency_members")
      .select("agency_id, member_role")
      .eq("member_id", userId)
      .maybeSingle();

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
