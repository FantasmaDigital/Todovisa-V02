async function handleResponse(res: Response) {
  let result: any = {};
  try {
    const text = await res.text();
    result = text ? JSON.parse(text) : {};
  } catch (e) {
    result = { error: `Server response error (${res.status})` };
  }
  if (!res.ok) throw new Error(result.error || `HTTP error ${res.status}`);
  return result;
}

export class ProfileClientService {
  static async getProfile(userId: string) {
    const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`);
    const result = await handleResponse(res);
    return result.data;
  }

  static async updateProfile(userId: string, updates: Record<string, any>) {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, updates }),
    });
    return handleResponse(res);
  }

  static async getCommissions(agentId: string) {
    const res = await fetch(`/api/profile/commissions?agentId=${encodeURIComponent(agentId)}`);
    const result = await handleResponse(res);
    return result.data;
  }

  static async getPayouts(agentId: string) {
    const res = await fetch(`/api/profile/payouts?agentId=${encodeURIComponent(agentId)}`);
    const result = await handleResponse(res);
    return result.data;
  }

  static async getTeam(agencyId: string) {
    const res = await fetch(`/api/profile/team?agencyId=${encodeURIComponent(agencyId)}`);
    const result = await handleResponse(res);
    return result.data;
  }

  static async inviteTeamMember(invitationData: Record<string, any>) {
    const res = await fetch("/api/profile/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invitationData),
    });
    return handleResponse(res);
  }

  static async respondInvitation(invitationId: string, action: 'accept' | 'decline') {
    const res = await fetch("/api/profile/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId, action }),
    });
    return handleResponse(res);
  }
}
