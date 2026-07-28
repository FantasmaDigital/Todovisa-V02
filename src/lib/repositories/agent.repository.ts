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
    // ⚡ Parallel: fetch active applications and agency members at the same time
    const [appsResult, membersResult] = await Promise.all([
      supabase
        .from("agent_applications")
        .select("user_id, full_name, email, phone, specialties, target_countries, languages, experience_years, biography, status, application_id")
        .eq("status", "active"),
      supabase
        .from("agency_members")
        .select("member_id"),
    ]);

    if (appsResult.error) throw new Error(appsResult.error.message);

    const activeApps = appsResult.data || [];
    const memberIdsSet = new Set<string>(
      (membersResult.data || []).map((m) => m.member_id)
    );

    return { activeApps, agencyMemberIds: Array.from(memberIdsSet) };
  }

  static async getPortalDetails(userId?: string) {
    let application: any = null;
    let fallbackData: any = null;
    let agencyApp: any = null;
    let members: any[] = [];
    let invitations: any[] = [];
    let commissions: any[] = [];

    if (userId) {
      // ⚡ Parallel: fire all userId-based queries simultaneously
      const [appResult, fallbackResult, agencyAppResult, membersResult, invitationsResult, commissionsResult] = await Promise.all([
        supabase.from("agent_applications").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("agent_applications").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("agent_applications").select("*").eq("agency_id", userId).maybeSingle(),
        supabase.from("agency_members").select("*").eq("agency_id", userId),
        supabase.from("agency_invitations").select("*").eq("agency_id", userId),
        supabase.from("agent_commissions").select("*").eq("agent_id", userId),
      ]);

      application = appResult.data;
      fallbackData = fallbackResult.data;
      agencyApp = agencyAppResult.data;
      members = membersResult.data || [];
      invitations = invitationsResult.data || [];
      commissions = commissionsResult.data || [];

      // If no application found by user_id, try lookup by email (email-linked fallback)
      if (!application) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", userId)
          .maybeSingle();

        if (profile?.email) {
          const { data: appByEmail } = await supabase
            .from("agent_applications")
            .select("*")
            .eq("email", profile.email)
            .maybeSingle();

          if (appByEmail) {
            application = appByEmail;
            // Fire-and-forget: link the application to the userId
            supabase
              .from("agent_applications")
              .update({ user_id: userId })
              .eq("id", appByEmail.id)
              .then(() => {});
          }
        }
      }
    } else {
      // No userId — just get the most recent application as fallback
      const { data: fallback } = await supabase
        .from("agent_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      fallbackData = fallback;
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

  static async getAllApplications() {
    const { data, error } = await supabase
      .from("agent_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async getAgencyClientRequests(agentId?: string) {
    let query = supabase.from("agency_client_requests").select("*");
    if (agentId) {
      query = query.eq("agency_id", agentId);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }
}
