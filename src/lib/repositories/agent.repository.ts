import supabase from "@/app/lib/supabase";
import supabaseAdmin from "@/lib/supabaseAdmin";
import { UserRole } from "@/app/constants/roles";

export class AgentRepository {
  static async createApplication(applicationData: Record<string, any>) {
    return await supabase
      .from("agent_applications")
      .upsert(applicationData, { onConflict: "email" });
  }

  static async getAgenciesWithApplications() {
    const { data: agencyProfiles, error: profileErr } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, photo_url, phone, bio, location")
      .eq("role", UserRole.AGENCY);

    if (profileErr) throw new Error(profileErr.message);

    let agencyAppsMap: Record<string, any> = {};
    if (agencyProfiles && agencyProfiles.length > 0) {
      const agencyIds = agencyProfiles.map((p) => p.id);
      const { data: agencyApps } = await supabase
        .from("agent_applications")
        .select("user_id, specialties, target_countries, languages, experience_years, biography, status, signature_name, signed_at")
        .in("user_id", agencyIds)
        .not("signed_at", "is", null);

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
        .select("user_id, full_name, email, phone, specialties, target_countries, languages, experience_years, biography, status, application_id, signed_at")
        .not("signed_at", "is", null),
      supabase
        .from("agency_members")
        .select("member_id"),
    ]);

    if (appsResult.error) throw new Error(appsResult.error.message);

    const rawActiveApps = appsResult.data || [];
    const memberIdsSet = new Set<string>(
      (membersResult.data || []).map((m) => m.member_id)
    );

    // Fetch photo_url from auth.users metadata (via SECURITY DEFINER RPC) + profiles fallback
    const userIds = rawActiveApps.map(app => app.user_id).filter(Boolean);
    let photoMap: Record<string, string> = {};
    if (userIds.length > 0) {
      // Try RPC first (reads auth.users raw_user_meta_data + profiles in one query)
      const { data: photosRpc, error: rpcError } = await supabase
        .rpc("get_agent_photos", { user_ids: userIds });

      if (!rpcError && photosRpc) {
        photosRpc.forEach((p: { id: string; photo_url: string | null }) => {
          if (p.photo_url) photoMap[p.id] = p.photo_url;
        });
      } else {
        // Fallback: read profiles table directly
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, photo_url")
          .in("id", userIds);

        profiles?.forEach(p => {
          if (p.photo_url) photoMap[p.id] = p.photo_url;
        });
      }
    }

    // Fetch agent reviews stats
    let reviewsStatsMap: Record<string, { rating: number; reviewsCount: number }> = {};
    const { data: reviewsData } = await supabase
      .from("agent_reviews")
      .select("agent_id, rating");

    if (reviewsData && reviewsData.length > 0) {
      const statsTemp: Record<string, { totalRating: number; count: number }> = {};
      reviewsData.forEach((rev) => {
        if (!statsTemp[rev.agent_id]) {
          statsTemp[rev.agent_id] = { totalRating: 0, count: 0 };
        }
        statsTemp[rev.agent_id].totalRating += Number(rev.rating) || 0;
        statsTemp[rev.agent_id].count += 1;
      });

      Object.keys(statsTemp).forEach((id) => {
        const item = statsTemp[id];
        reviewsStatsMap[id] = {
          rating: Number((item.totalRating / item.count).toFixed(1)),
          reviewsCount: item.count,
        };
      });
    }

    // Merge photo_url and reviews stats into activeApps data
    const activeApps = rawActiveApps.map(app => {
      const agentKey = app.user_id || app.application_id;
      const stats = reviewsStatsMap[agentKey] || (app.user_id ? reviewsStatsMap[app.user_id] : null) || { rating: 5.0, reviewsCount: 0 };

      return {
        ...app,
        photo_url: app.user_id ? (photoMap[app.user_id] || null) : null,
        rating: stats.rating,
        reviewsCount: stats.reviewsCount,
      };
    });

    return { activeApps, agencyMemberIds: Array.from(memberIdsSet) };
  }

  static async getAgentReviews(agentId: string) {
    const { data, error } = await supabase
      .from("agent_reviews")
      .select("*")
      .or(`agent_id.eq.${agentId},agent_id.eq.agent-${agentId}`)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async createAgentReview(reviewData: {
    agent_id: string;
    reviewer_id?: string;
    reviewer_name?: string;
    rating: number;
    comment: string;
  }) {
    const dbClient = supabaseAdmin || supabase;
    const { data, error } = await dbClient
      .from("agent_reviews")
      .insert({
        agent_id: reviewData.agent_id,
        reviewer_id: reviewData.reviewer_id || null,
        reviewer_name: reviewData.reviewer_name || "Cliente TodoVisa",
        rating: Math.max(1, Math.min(5, Math.round(reviewData.rating))),
        comment: reviewData.comment || "",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getPortalDetails(userId?: string, applicationId?: string) {
    let application: any = null;
    let fallbackData: any = null;
    let agencyApp: any = null;
    let members: any[] = [];
    let invitations: any[] = [];
    let commissions: any[] = [];

    if (applicationId) {
      const { data: appData } = await supabase
        .from("agent_applications")
        .select("*")
        .eq("application_id", applicationId)
        .maybeSingle();
      application = appData;

      const targetId = application?.user_id || application?.agency_id || application?.id;
      if (targetId) {
        const [agencyAppResult, membersResult, invitationsResult, commissionsResult] = await Promise.all([
          supabase.from("agent_applications").select("*").eq("agency_id", targetId).maybeSingle(),
          supabase.from("agency_members").select("*").eq("agency_id", targetId),
          supabase.from("agency_invitations").select("*").eq("agency_id", targetId),
          supabase.from("agent_commissions").select("*").eq("agent_id", targetId),
        ]);
        agencyApp = agencyAppResult.data;
        members = membersResult.data || [];
        invitations = invitationsResult.data || [];
        commissions = commissionsResult.data || [];
      }
    } else if (userId) {
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
    let targetAgencyId = requestData.agency_id;

    if (!targetAgencyId && requestData.agencyName) {
      const { data: agencyProfile } = await supabase
        .from("profiles")
        .select("id")
        .ilike("first_name", `%${requestData.agencyName}%`)
        .maybeSingle();
      if (agencyProfile) {
        targetAgencyId = agencyProfile.id;
      }
    }

    if (targetAgencyId) {
      return await supabase.from("agency_client_requests").insert({
        agency_id: targetAgencyId,
        client_id: requestData.client_id,
        client_name: requestData.client_name || "Cliente TodoVisa",
        client_email: requestData.client_email || "",
        status: "pending",
        agency_name: requestData.agencyName || null,
        agent_hired_id: requestData.agent_hired_id || null,
        created_at: new Date().toISOString(),
      });
    }
    return { data: null, error: null };
  }

  static async createAgentCommission(commissionData: Record<string, any>) {
    // Map service_type to allowed constraint values ('vipro' or 'full_service')
    let serviceType = commissionData.service_type || "full_service";
    if (serviceType !== "vipro" && serviceType !== "full_service") {
      serviceType = "full_service";
    }

    // Standardize folio number
    const folio = commissionData.client_folio || `TDA-${Math.floor(100000 + Math.random() * 900000)}`;

    // Standardize rate percentage (e.g., 0.40 -> 40, 0.30 -> 30, 0.60 -> 60)
    let rate = Number(commissionData.commission_rate || 0);
    if (rate > 0 && rate <= 1) {
      rate = rate * 100;
    }

    const grossAmt = Number(commissionData.sale_amount || commissionData.gross_amount || 0);
    const commAmt = Number(commissionData.commission_amount || (grossAmt * (rate / 100)));

    let targetAgentId = commissionData.agent_id;
    const isUuidCheck = (str: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

    const dbClientForLookup = supabaseAdmin || supabase;
    let resolvedUuid: string | null = null;

    if (targetAgentId && isUuidCheck(targetAgentId)) {
      resolvedUuid = targetAgentId;
    }

    if (targetAgentId) {
      // 1. Check agent_applications by id, application_id, user_id, agency_id, or email
      const { data: appData } = await dbClientForLookup
        .from("agent_applications")
        .select("id, user_id, application_id, email, agency_id")
        .or(`id.eq.${targetAgentId},application_id.eq.${targetAgentId},user_id.eq.${targetAgentId},agency_id.eq.${targetAgentId},email.eq.${targetAgentId}`)
        .maybeSingle();

      if (appData) {
        if (appData.user_id && isUuidCheck(appData.user_id)) {
          resolvedUuid = appData.user_id;
        } else if (appData.agency_id && isUuidCheck(appData.agency_id)) {
          resolvedUuid = appData.agency_id;
        } else if (appData.id && isUuidCheck(appData.id)) {
          resolvedUuid = appData.id;
        } else if (appData.email) {
          const { data: profByEmail } = await dbClientForLookup
            .from("profiles")
            .select("id")
            .eq("email", appData.email)
            .maybeSingle();
          if (profByEmail?.id && isUuidCheck(profByEmail.id)) {
            resolvedUuid = profByEmail.id;
          }
        }
      }

      // 2. Check profiles directly by id or email
      if (!resolvedUuid) {
        const { data: profData } = await dbClientForLookup
          .from("profiles")
          .select("id, email")
          .or(`id.eq.${targetAgentId},email.eq.${targetAgentId}`)
          .maybeSingle();

        if (profData?.id && isUuidCheck(profData.id)) {
          resolvedUuid = profData.id;
        }
      }

      // 3. Check agency_referral_leads by agency_code, agency_id, or id
      if (!resolvedUuid) {
        const { data: leadData } = await dbClientForLookup
          .from("agency_referral_leads")
          .select("id, agency_id, agency_code")
          .or(`agency_code.eq.${targetAgentId},agency_id.eq.${targetAgentId},id.eq.${targetAgentId}`)
          .maybeSingle();

        if (leadData?.agency_id && isUuidCheck(leadData.agency_id)) {
          resolvedUuid = leadData.agency_id;
        }
      }
    }

    const payload: Record<string, any> = {
      agent_id: resolvedUuid,
      client_folio: folio,
      client_name: commissionData.client_name || "Cliente TodoVisa",
      service_type: serviceType,
      gross_amount: grossAmt,
      commission_rate: rate,
      status: commissionData.status || "pending",
      created_at: new Date().toISOString()
    };

    // Store rich metadata in notes column (PayPal Tx ID, Client Email, Rates breakdown, etc.)
    const notesObj = typeof commissionData.notes === "object" && commissionData.notes !== null
      ? { ...commissionData.notes }
      : { raw_notes: String(commissionData.notes || "") };

    notesObj.original_agent_id = commissionData.agent_id || "";
    notesObj.agency_code = commissionData.agent_id || "";
    if (resolvedUuid) {
      notesObj.resolved_agent_id = resolvedUuid;
    }

    payload.notes = JSON.stringify(notesObj);

    const dbClient = supabaseAdmin || supabase;
    let { data, error } = await dbClient.from("agent_commissions").insert({
      ...payload,
      commission_amount: commAmt
    }).select();

    // If error occurs on commission_amount (e.g. GENERATED ALWAYS column or schema mismatch), fallback without supplying commission_amount
    if (error) {
      console.warn("Attempting fallback insert into agent_commissions without commission_amount:", error.message);
      const fallbackResult = await dbClient.from("agent_commissions").insert(payload).select();
      if (!fallbackResult.error) {
        data = fallbackResult.data;
        error = null;
      }
    }

    if (error) {
      console.error("Final error in AgentRepository.createAgentCommission:", error);
    }

    return { data, error };
  }

  static async createUserPurchase(purchaseData: Record<string, any>) {
    const dbClient = supabaseAdmin || supabase;
    const payload: Record<string, any> = {
      user_id: purchaseData.user_id,
      reference_id: purchaseData.reference_id || `TV-${(purchaseData.product_type || 'TX').toUpperCase()}-${Date.now().toString().slice(-6)}`,
      product_type: purchaseData.product_type || 'vipro',
      amount: Number(purchaseData.amount || 0),
      payment_method: purchaseData.payment_method || 'paypal',
      status: purchaseData.status || 'completed',
      agent_id: purchaseData.agent_id || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await dbClient.from("user_purchases").insert(payload).select();
    return { data, error };
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
    const { data: requests, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const clientRequests = [...(requests || [])];

    if (agentId) {
      // Find client IDs from messages table linked to this agent
      const { data: messages } = await supabase
        .from("messages")
        .select("user_id")
        .or(`agent_id.eq.${agentId},agent_id.eq.agent-${agentId}`);

      if (messages && messages.length > 0) {
        const uniqueClientIds = Array.from(new Set(messages.map(m => m.user_id).filter(Boolean)));
        
        for (const clientId of uniqueClientIds) {
          if (!clientRequests.some(r => r.client_id === clientId)) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", clientId)
              .maybeSingle();

            if (profile) {
              clientRequests.push({
                id: `synthetic-${clientId}`,
                agency_id: agentId,
                client_id: clientId,
                client_name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email,
                client_email: profile.email,
                status: "pending",
                service_type: "Full Advisor Concierge",
                created_at: profile.updated_at || new Date().toISOString()
              });
            }
          }
        }
      }
    }

    return clientRequests;
  }
}
