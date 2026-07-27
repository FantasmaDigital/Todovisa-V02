import { getAuthHeaders } from "./AuthClientService";

async function handleResponse(res: Response) {
  let result: any = {};
  try {
    const text = await res.text();
    result = text ? JSON.parse(text) : {};
  } catch (e) {
    result = { error: res.status === 404 ? "Resource not found (404)" : `Server response error (${res.status})` };
  }
  if (!res.ok) {
    console.warn(`[ProfileClientService Error ${res.status}] URL: ${res.url} - Error:`, result.error || `HTTP ${res.status}`);
    if (res.status === 404) {
      return { data: null, error: "Resource not found (404)" };
    }
    throw new Error(result.error || `HTTP error ${res.status}`);
  }
  return result;
}

export class ProfileClientService {
  static async getProfile(userId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`, { headers });
    const result = await handleResponse(res);
    return result.data;
  }

  static async getAllProfiles() {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/profile?all=true`, { headers });
    const result = await handleResponse(res);
    return result.data;
  }

  static async updateProfile(userId: string, updates: Record<string, any>) {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ userId, updates }),
    });
    return handleResponse(res);
  }

  static async getCommissions(agentId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/profile/commissions?agentId=${encodeURIComponent(agentId)}`, { headers });
    const result = await handleResponse(res);
    return result.data;
  }

  static async getPayouts(agentId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/profile/payouts?agentId=${encodeURIComponent(agentId)}`, { headers });
    const result = await handleResponse(res);
    return result.data;
  }

  static async getTeam(agencyId: string) {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/profile/team?agencyId=${encodeURIComponent(agencyId)}`, { headers });
    const result = await handleResponse(res);
    return result.data;
  }

  static async inviteTeamMember(invitationData: Record<string, any>) {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/profile/team", {
      method: "POST",
      headers,
      body: JSON.stringify(invitationData),
    });
    return handleResponse(res);
  }

  static async respondInvitation(invitationId: string, action: 'accept' | 'decline') {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/profile/team", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ invitationId, action }),
    });
    return handleResponse(res);
  }
}
