import supabase from "@/app/lib/supabase";

export class AgentRepository {
  static async createApplication(applicationData: Record<string, any>) {
    return await supabase.from("agent_applications").insert(applicationData);
  }

  static async getAgenciesWithApplications() {
    const { data: agencyProfiles, error: profileErr } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, photo_url, phone, bio, location")
      .eq("role", "agency");

    if (profileErr) throw new Error(profileErr.message);

    let agencyAppsMap: Record<string, any> = {};
    if (agencyProfiles && agencyProfiles.length > 0) {
      const agencyIds = agencyProfiles.map((p) => p.id);
      const { data: agencyApps } = await supabase
        .from("agent_applications")
        .select("user_id, specialties, target_countries, languages, experience_years, biography, status, signature_name")
        .in("user_id", agencyIds)
        .eq("status", "active");

      agencyApps?.forEach((a) => {
        agencyAppsMap[a.user_id] = a;
      });
    }

    return { agencyProfiles: agencyProfiles || [], agencyAppsMap };
  }

  static async getActiveIndependentAgents() {
    const { data: activeApps, error: appErr } = await supabase
      .from("agent_applications")
      .select("user_id, full_name, email, phone, specialties, target_countries, languages, experience_years, biography, status, application_id")
      .eq("status", "active");

    if (appErr) throw new Error(appErr.message);

    let memberIdsSet = new Set<string>();
    const appUserIds = (activeApps || []).map((a) => a.user_id).filter(Boolean);

    if (appUserIds.length > 0) {
      const { data: members } = await supabase
        .from("agency_members")
        .select("member_id")
        .in("member_id", appUserIds);
      members?.forEach((m) => memberIdsSet.add(m.member_id));
    }

    return { activeApps: activeApps || [], agencyMemberIds: Array.from(memberIdsSet) };
  }

  static async getPortalDetails(userId?: string) {
    let application: any = null;
    let fallbackData: any = null;
    let agencyApp: any = null;
    let members: any[] = [];
    let invitations: any[] = [];
    let commissions: any[] = [];

    if (userId) {
      const { data } = await supabase
        .from("agent_applications")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      application = data;
    }

    const { data: fallback } = await supabase
      .from("agent_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    fallbackData = fallback;

    if (userId) {
      const { data: agApp } = await supabase
        .from("agent_applications")
        .select("*")
        .eq("agency_id", userId)
        .maybeSingle();
      agencyApp = agApp;
    }

    if (userId) {
      const { data: mems } = await supabase
        .from("agency_members")
        .select("*")
        .eq("agency_id", userId);
      members = mems || [];

      const { data: invs } = await supabase
        .from("agency_invitations")
        .select("*")
        .eq("agency_id", userId);
      invitations = invs || [];

      const { data: comms } = await supabase
        .from("agent_commissions")
        .select("*")
        .eq("agent_id", userId);
      commissions = comms || [];
    }

    return { application, fallbackData, agencyApp, members, invitations, commissions };
  }

  static async updateApplication(id: string, updates: Record<string, any>) {
    return await supabase
      .from("agent_applications")
      .update(updates)
      .eq("id", id);
  }

  static async updateApplicationByUserId(userId: string, updates: Record<string, any>) {
    return await supabase
      .from("agent_applications")
      .update(updates)
      .eq("user_id", userId);
  }

  static async createAgencyClientRequest(requestData: Record<string, any>) {
    const { data: agencyProfile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("first_name", `%${requestData.agencyName}%`)
      .maybeSingle();

    if (agencyProfile?.id) {
      return await supabase.from("agency_client_requests").insert({
        agency_id: agencyProfile.id,
        client_id: requestData.client_id,
        client_name: requestData.client_name,
        client_email: requestData.client_email,
        status: "pending",
        service_type: requestData.service_type || "Full Advisor Concierge",
        created_at: new Date().toISOString(),
      });
    }
    return { data: null, error: null };
  }

  static async createAgentCommission(commissionData: Record<string, any>) {
    return await supabase.from("agent_commissions").insert(commissionData);
  }
}
